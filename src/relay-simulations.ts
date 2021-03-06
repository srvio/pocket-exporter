import axios from "axios";
import { Gauge, Counter } from "prom-client";
import { isRPCAvailable } from "./pokt-poller";

const { RPC_ADDRESS } = process.env;
const rpcAddress = RPC_ADDRESS || "http://localhost:8081";

const simRelayChainHeight = new Gauge({
  name: "pocket_sim_relay_chain_height",
  help: "Height of the blockchain configured in the chains.json",
  labelNames: ["chain"],
});

const simRelayChainError = new Counter({
  name: "pocket_sim_relay_chain_error",
  help: "Error talking to the chain from chains.json",
  labelNames: ["chain"],
});

const simRelayChainNotImplemented = new Counter({
  name: "pocket_sim_relay_chain_not_implemented",
  help: "Chain from chains.json is not implemented in the exporter",
  labelNames: ["chain"],
});

interface Chain {
  name: string;
  getHeight: () => Promise<number>;
}

interface Chains {
  [id: string]: Chain;
}

const supportedChains = {
  "0040": {
    name: "harmony",
    getHeight: async () => {
      const res = await axios({
        method: "POST",
        url: rpcAddress + "/v1/client/sim",
        data: {
          relay_network_id: "0040",
          payload: {
            data: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "hmyv2_blockNumber",
              params: [],
            }),
            method: "POST",
            path: "",
            headers: {},
          },
        },
      });
      return Number(JSON.parse(res.data).result);
    },
  },
  "0005": {
    name: "fuse",
    getHeight: async () => {
      const res = await axios({
        method: "POST",
        url: rpcAddress + "/v1/client/sim",
        data: {
          relay_network_id: "0005",
          payload: {
            data: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_blockNumber",
              params: [],
            }),
            method: "POST",
            path: "",
            headers: {},
          },
        },
      });
      return Number(JSON.parse(res.data).result);
    },
  },
  "0027": {
    name: "xdai",
    getHeight: async () => {
      const res = await axios({
        method: "POST",
        url: rpcAddress + "/v1/client/sim",
        data: {
          relay_network_id: "0027",
          payload: {
            data: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_blockNumber",
              params: [],
            }),
            method: "POST",
            path: "",
            headers: {},
          },
        },
      });
      return Number(JSON.parse(res.data).result);
    },
  },
  "0021": {
    name: "etherium",
    getHeight: async () => {
      const res = await axios({
        method: "POST",
        url: rpcAddress + "/v1/client/sim",
        data: {
          relay_network_id: "0021",
          payload: {
            data: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_blockNumber",
              params: [],
            }),
            method: "POST",
            path: "",
            headers: {},
          },
        },
      });
      return Number(JSON.parse(res.data).result);
    },
  },
  "0001": {
    name: "pocket-network",
    getHeight: async () => {
      const res = await axios({
        method: "POST",
        url: rpcAddress + "/v1/client/sim",
        data: {
          relay_network_id: "0001",
          payload: {
            data: JSON.stringify({}),
            method: "POST",
            path: "v1/query/height",
            headers: {},
          },
        },
      });
      return Number(JSON.parse(res.data).height);
    },
  },
} as Chains;

export const simulateRelaysForChains = async (chains: string[]) => {
  if (isRPCAvailable() === false) {
    console.log("RPC is not available yet");
    return;
  }

  chains.forEach(async (chain) => {
    if (!supportedChains[chain]) {
      simRelayChainNotImplemented.inc({ chain });
      return;
    }

    try {
      const res = await supportedChains[chain].getHeight();
      simRelayChainHeight.set({ chain }, res);
    } catch (error) {
      simRelayChainError.inc({ chain });
      console.error(error?.message, error?.response?.data);
    }
  });
};
