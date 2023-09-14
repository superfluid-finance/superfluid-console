import { GridColDef } from "@mui/x-data-grid";
import {
  Ordering,
  PagedResult,
  SkipPaging,
} from "@superfluid-finance/sdk-core";
import { BigNumber } from "ethers";
import { FC, useMemo } from "react";
import { useNetworkContext } from "../contexts/NetworkContext";
import { AppDataGrid } from "./AppDataGrid";
import EtherFormatted from "./EtherFormatted";
import SuperTokenAddress from "./SuperTokenAddress";
import TimeAgo from "./TimeAgo";
import { Pool } from "../gda-subgraph/entities/pool/pool";
import { InstantDistributionUpdatedEvent_OrderBy } from "../gda-subgraph/.graphclient";
import { InstantDistributionUpdatedEvent } from "../gda-subgraph/events";

interface Props {
  pool: Pool | null | undefined;
  queryResult: {
    isFetching: boolean;
    data?: PagedResult<InstantDistributionUpdatedEvent>;
  };
  setPaging: (paging: SkipPaging) => void;
  ordering: Ordering<InstantDistributionUpdatedEvent_OrderBy> | undefined;
  setOrdering: (ordering?: Ordering<InstantDistributionUpdatedEvent_OrderBy>) => void;
}

interface Distribution {
  id: string;
  totalConnectedUnits: string;
  totalDisconnectedUnits: string;
  timestamp: number;
  distributionAmount: BigNumber;
}

const calculateDistributionAmount = (event: InstantDistributionUpdatedEvent): BigNumber => {
  const totalUnits = BigNumber.from(event.totalConnectedUnits).add(
    BigNumber.from(event.totalDisconnectedUnits)
  );
    
  // const indexValueDifference = BigNumber.from(event.newIndexValue).sub(
  //   BigNumber.from(event.oldIndexValue)
  // );
  return BigNumber.from(event.actualAmount).mul(totalUnits);
};

const InstantDistributionUpdatedEventDataGrid: FC<Props> = ({
  pool,
  queryResult,
  setPaging,
  ordering,
  setOrdering,
}) => {
  const network = useNetworkContext();

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "id", hide: true, sortable: false, flex: 1 },
      {
        field: "timestamp",
        headerName: "Distribution Date",
        sortable: true,
        flex: 0.5,
        renderCell: (params) => <TimeAgo subgraphTime={params.value} />,
      },
      {
        field: "distributionAmount",
        headerName: "Distribution Amount",
        hide: false,
        sortable: false,
        flex: 1.5,
        renderCell: (params) => {
          return (
            <>
              <EtherFormatted wei={params.value} />
              &nbsp;
              {pool && (
                <SuperTokenAddress
                  network={network}
                  address={pool.token}
                  format={(token) => token.symbol}
                  formatLoading={() => ""}
                />
              )}
            </>
          );
        },
      },
    ],
    [pool, network]
  );

  const rows: Distribution[] =
    queryResult.data && pool
      ? queryResult.data.data.map((instantDistributionUpdatedEvent) => ({
          id: instantDistributionUpdatedEvent.id,
          distributionAmount: calculateDistributionAmount(instantDistributionUpdatedEvent),
          timestamp: instantDistributionUpdatedEvent.timestamp,
          totalConnectedUnits: instantDistributionUpdatedEvent.totalConnectedUnits,
          totalDisconnectedUnits: instantDistributionUpdatedEvent.totalDisconnectedUnits,
        }))
      : [];

  return (
    <AppDataGrid
      columns={columns}
      rows={rows}
      queryResult={queryResult}
      setPaging={setPaging}
      ordering={ordering}
      setOrdering={(x) => setOrdering(x as any)}
    />
  );
};

export default InstantDistributionUpdatedEventDataGrid;
