import {
  HttpRpcProvider,
  Pocket,
  QueryAccountResponse,
  QueryHeightResponse,
  QueryNodeResponse,
} from "@pokt-network/pocket-js";
import { Gauge } from "prom-client";
import { readFileSync } from "fs";
import { join } from "path";
import { simulateRelaysForChains } from "./relay-simulations";

const {
  INTERVAL_SECONDS,
  CHECK_ADDRESSES,
  CHECK_VALIDATOR,
  RPC_ADDRESS,
  CHECK_HEIGHT,
  POCKET_DIR,
  PERFORM_RELAY_SIMULATIONS,
  VALIDATOR_ADDRESS,
} = process.env;

const POCKET_DISPATCHER = new URL(RPC_ADDRESS || "http://localhost:8081");
const rpcProvider = new HttpRpcProvider(POCKET_DISPATCHER);
const pocket = new Pocket([POCKET_DISPATCHER], rpcProvider);

const height = new Gauge({
  name: "pocket_node_height",
  help: "Pocket node height",
});

const stakedChainMissingConfig = new Gauge({
  name: "pocket_node_staked_chain_config_missing",
  help: "Chain is staked but is missing from chains.json",
  labelNames: ["chain"],
});

const balance = new Gauge({
  name: "pocket_account_balance_upokt",
  help: "Balance of the pocket account",
  labelNames: ["address"],
});

const isJailed = new Gauge({
  name: "pocket_node_jailed",
  help: "1 - node is jailed, 0 - not jailed",
  labelNames: ["address"],
});

// https://github.com/pokt-network/pocket-core/blob/7c55bfdf494f9fa2069f01443fa5a39891686ce6/types/staking.go#L41
const nodeStatus = new Gauge({
  name: "pocket_node_status",
  help: "0 - Unstaked, 1 - Unstaking, 2 - Staked",
  labelNames: ["address"],
});

const stakedBalance = new Gauge({
  name: "pocket_node_staked_balance_upokt",
  help: "Balance of the staked node",
  labelNames: ["address"],
});

const updateHeight = async () => {
  try {
    const resp = await pocket.rpc().query.getHeight();
    if (resp instanceof QueryHeightResponse) {
      height.set(Number(resp.height));
    } else {
      // console.log(resp);
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateAccount = async (address: string) => {
  try {
    const resp = await pocket.rpc().query.getAccount(address);
    if (resp instanceof QueryAccountResponse) {
      balance.labels({ address }).set(Number(resp.balance));
    } else {
      // console.log(resp);
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateNode = async (address: string) => {
  try {
    const resp = await pocket.rpc().query.getNode(address);
    if (resp instanceof QueryNodeResponse) {
      isJailed.labels({ address }).set(resp.node.jailed ? 1 : 0);
      nodeStatus.labels({ address }).set(Number(resp.node.status));
      stakedBalance.labels({ address }).set(Number(resp.node.stakedTokens));
    } else {
      // console.log(resp);
    }
  } catch (error) {
    console.log(error);
  }
};

const performChecks = async () => {
  const addresses = (CHECK_ADDRESSES || "").split(",");
  if (VALIDATOR_ADDRESS) {
    addresses.push(VALIDATOR_ADDRESS);
  }

  CHECK_HEIGHT != "false" ? updateHeight() : null;

  addresses.forEach((addr) => {
    updateAccount(addr);
    updateNode(addr);
  });

  if (!(CHECK_VALIDATOR === "false")) {
    const address = getValidator();
    const node = await pocket.rpc().query.getNode(address);
    if (!(node instanceof QueryNodeResponse)) {
      return;
    }

    const stakedChains = node.node.chains;
    const configuredChains = getConfiguredChains();

    stakedChains.forEach(function (chain) {
      if (!configuredChains.includes(chain)) {
        stakedChainMissingConfig.set({ chain }, 1);
      }
    });

    if (!(PERFORM_RELAY_SIMULATIONS === "false")) {
      simulateRelaysForChains(configuredChains);
    }
  }
};

// https://github.com/pokt-network/pocket-core/blob/0f0501de8ab9d5035d388b40ad80e5b4519805af/app/cmd/cli/accounts.go#L118
const getValidator = () => {
  if (VALIDATOR_ADDRESS) {
    return VALIDATOR_ADDRESS;
  }

  const privKeyFile = readFileSync(
    join(POCKET_DIR, "priv_val_key.json"),
    "utf8"
  );
  return JSON.parse(privKeyFile).address as string;
};

const getConfiguredChains = () => {
  const chainsJson = readFileSync(
    join(POCKET_DIR, "config", "chains.json"),
    "utf8"
  );
  return JSON.parse(chainsJson).map((el) => el.id) as string[];
};

export function init() {
  (async () => {
    setInterval(async () => {
      performChecks();
    }, Number(INTERVAL_SECONDS || 60) * 1000);
  })();
}
