import { Chip } from "@mui/material";
import _ from "lodash";
import { FC } from "react";
import { Network } from "../redux/networks";
import { sfSubgraph } from "../redux/store";
import AppLink from "./AppLink";
import FlowingBalance, { FlowingBalanceProps } from "./FlowingBalance";

const FlowingBalanceWithToken: FC<
  FlowingBalanceProps & { network: Network; tokenAddress: string }
> = ({ network, tokenAddress, ...flowingBalanceProps }) => {
  const tokenQuery = sfSubgraph.useTokenQuery({
    chainId: network.chainId,
    id: tokenAddress,
  });
  return (
    <>
      {tokenQuery.data ? (
        <AppLink
          data-cy={"token-link"}
          className="address"
          href={`/${network.slugName}/supertokens/${tokenAddress}`}
        >
          <Chip label={tokenQuery.data.symbol} size="small" sx={{ mr: 1 }} />
        </AppLink>
      ) : null}
      {/* &nbsp; */}
      <FlowingBalance {...flowingBalanceProps} />
    </>
  );
};

export default FlowingBalanceWithToken;
