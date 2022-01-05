import {
  HttpRpcProvider,
  Pocket,
  QueryAccountResponse,
  QueryHeightResponse,
  QueryNodeResponse,
} from "@pokt-network/pocket-js";
import { Gauge } from "prom-client";
const { INTERVAL_SECONDS, CHECK_ADDRESSES, RPC_ADDRESS, CHECK_HEIGHT } =
  process.env;

const POCKET_DISPATCHER = new URL(RPC_ADDRESS || "http://localhost:8081");
const rpcProvider = new HttpRpcProvider(POCKET_DISPATCHER);
const pocket = new Pocket([POCKET_DISPATCHER], rpcProvider);

const height = new Gauge({
  name: "pocket_node_height",
  help: "Pocket node height",
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
  const resp = await pocket.rpc().query.getHeight();
  if (resp instanceof QueryHeightResponse) {
    height.set(Number(resp.height));
  }
};

const updateAccount = async (address: string) => {
  const resp = await pocket.rpc().query.getAccount(address);
  if (resp instanceof QueryAccountResponse) {
    balance.labels({ address }).set(Number(resp.balance));
  }
};

const updateNode = async (address: string) => {
  const resp = await pocket.rpc().query.getNode(address);
  if (resp instanceof QueryNodeResponse) {
    isJailed.labels({ address }).set(resp.node.jailed ? 1 : 0);
    nodeStatus.labels({ address }).set(Number(resp.node.status));
    stakedBalance.labels({ address }).set(Number(resp.node.stakedTokens));
  }
};

export function init() {
  const addresses = CHECK_ADDRESSES.split(",");
  (async () => {
    setInterval(() => {
      CHECK_HEIGHT != "false" ? updateHeight() : null;

      addresses.forEach((addr) => {
        updateAccount(addr);
        updateNode(addr);
      });
    }, Number(INTERVAL_SECONDS || 60) * 1000);
  })();
}
