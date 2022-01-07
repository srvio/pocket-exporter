# pocket-exporter

Provides Pocket Network metrics in OpenMetrics standard that can be utilized by Prometheus/VictoriaMetrics/Thanos/Etc.

### Docker image
`okdas/pocket-exporter` — just the latest tag for now, no verifiable cicd process with releases yet.

### Scraping endpoint
The service listens on `9000` port, and `/metric` path.

It is recommended to use the same scraping interval as `INTERVAL_SECONDS` value.

### Configuration

| Environment variable      | Description |
| ----------- | ----------- |
| `INTERVAL_SECONDS`      | Interval in seconds to issue RPC calls to the Pocket RPC       |
| `CHECK_ADDRESSES`   | Comma separated list of addresses to check balance, stake amount and stake status        |
| `RPC_ADDRESS`   | Address of the RPC node        |
| `CHECK_HEIGHT`   | `true` / `false` whether to check the height of the blockchain.        |
| `INCLUDE_NODEJS_METRICS`   | `true` / `false` whether to include exporter's own nodejs metrics        |

### Provided metrics 

```
# HELP pocket_node_height Pocket node height
# TYPE pocket_node_height gauge
pocket_node_height 47365

# HELP pocket_account_balance_upokt Balance of the pocket account
# TYPE pocket_account_balance_upokt gauge
pocket_account_balance_upokt{address="01a2c7d61502a8ec5834a8f75873453883137611"} 212188305

# HELP pocket_node_jailed 1 - node is jailed, 0 - not jailed
# TYPE pocket_node_jailed gauge
pocket_node_jailed{address="01a2c7d61502a8ec5834a8f75873453883137611"} 0

# HELP pocket_node_status 0 - Unstaked, 1 - Unstaking, 2 - Staked
# TYPE pocket_node_status gauge
pocket_node_status{address="01a2c7d61502a8ec5834a8f75873453883137611"} 2

# HELP pocket_node_staked_balance_upokt Balance of the staked node
# TYPE pocket_node_staked_balance_upokt gauge
pocket_node_staked_balance_upokt{address="01a2c7d61502a8ec5834a8f75873453883137611"} 15400000000
```
