import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Box,
  Button,
  Chip,
  IconButton,
  OutlinedInput,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  TableSortLabel,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  createSkipPaging,
  Ordering,
} from "@superfluid-finance/sdk-core";
import omit from "lodash/fp/omit";
import set from "lodash/fp/set";
import isEqual from "lodash/isEqual";
import { ChangeEvent, FC, FormEvent, useEffect, useRef, useState } from "react";
import useDebounce from "../../../hooks/useDebounce";
import { Network } from "../../../redux/networks";
import { sfGdaSubgraph } from "../../../redux/store";
import BalanceWithToken from "../../BalanceWithToken";
import ClearInputAdornment from "../../ClearInputAdornment";
import DetailsButton from "../../DetailsButton";
import InfinitePagination from "../../InfinitePagination";
import InfoTooltipBtn from "../../InfoTooltipBtn";
import TableLoader from "../../TableLoader";
import TimeAgo from "../../TimeAgo";
import { PoolsQuery } from "../../../gda-subgraph/endpoints/entityArgs";
import { Pool } from "../../../gda-subgraph/entities/pool/pool";
import { PoolPublicationDetailsDialog } from "../../PoolPublicationDetails";
import { Pool_Filter, Pool_OrderBy } from "../../../gda-subgraph/.graphclient";

export enum DistributionStatus {
  Distributed,
  NotDistributed,
}

export enum UnitsStatus {
  Issued,
  NotIssued,
}

export const publishedPoolOrderingDefault: Ordering<Pool_OrderBy> = {
  orderBy: "createdAtTimestamp",
  orderDirection: "desc",
};

export const publishedPoolPagingDefault = createSkipPaging({
  take: 10,
});

interface AccountPublishedPoolsTableProps {
  network: Network;
  accountAddress: string;
}


type RequiredPoolsQuery = Required<Omit<PoolsQuery, "block">>;

const AccountPublishedPoolsTable: FC<AccountPublishedPoolsTableProps> = ({
  network,
  accountAddress,
}) => {
  const filterAnchorRef = useRef(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [distributionStatus, setDistributionStatus] =
    useState<DistributionStatus | null>(null);
  const [unitsStatus, setUnitsStatus] = useState<UnitsStatus | null>(null);

  const defaultFilter = {
    admin: accountAddress,
  };

  const createDefaultArg = (): RequiredPoolsQuery => ({
    chainId: network.chainId,
    filter: defaultFilter,
    pagination: publishedPoolPagingDefault,
    order: publishedPoolOrderingDefault,
  });

  const [queryArg, setQueryArg] = useState<RequiredPoolsQuery>(
    createDefaultArg()
  );

  const [queryTrigger, queryResult] = sfGdaSubgraph.useLazyPoolsQuery();

  const queryTriggerDebounced = useDebounce(queryTrigger, 250);

  const onQueryArgChanged = (newArgs: RequiredPoolsQuery) => {
    setQueryArg(newArgs);

    if (
      queryResult.originalArgs &&
      !isEqual(queryResult.originalArgs.filter, newArgs.filter)
    ) {
      queryTriggerDebounced(newArgs, true);
    } else {
      queryTrigger(newArgs, true);
    }
  };

  useEffect(() => {
    onQueryArgChanged(createDefaultArg());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network, accountAddress]);

  const setPage = (newPage: number) =>
    onQueryArgChanged(
      set("pagination.skip", (newPage - 1) * queryArg.pagination.take, queryArg)
    );

  const setPageSize = (newPageSize: number) =>
    onQueryArgChanged(set("pagination.take", newPageSize, queryArg));

  const onOrderingChanged = (newOrdering: Ordering<Pool_OrderBy>) =>
    onQueryArgChanged({ ...queryArg, order: newOrdering });

  const onSortClicked = (field: Pool_OrderBy) => () => {
    if (queryArg.order.orderBy !== field) {
      onOrderingChanged({
        orderBy: field,
        orderDirection: "desc",
      });
    } else if (queryArg.order.orderDirection === "desc") {
      onOrderingChanged({
        orderBy: field,
        orderDirection: "asc",
      });
    } else {
      onOrderingChanged(publishedPoolOrderingDefault);
    }
  };

  const onFilterChange = (newFilter: Pool_Filter) => {
    onQueryArgChanged({
      ...queryArg,
      pagination: { ...queryArg.pagination, skip: 0 },
      filter: newFilter,
    });
  };

  const onPoolIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onFilterChange({
        ...queryArg.filter,
        id: e.target.value,
      });
    } else {
      onFilterChange(omit("id", queryArg.filter));
    }
  };

  const getDistributionStatusFilter = (
    status: DistributionStatus | null
  ): Pool_Filter => {
    switch (status) {
      case DistributionStatus.Distributed:
        return { totalAmountDistributedUntilUpdatedAt_gt: "0" };
      case DistributionStatus.NotDistributed:
        return { totalAmountDistributedUntilUpdatedAt: "0" };
      default:
        return {};
    }
  };

  const changeDistributionStatus = (newStatus: DistributionStatus | null) => {
    const {
      totalAmountDistributedUntilUpdatedAt_gt,
      totalAmountDistributedUntilUpdatedAt,
      ...newFilter
    } = queryArg.filter;

    setDistributionStatus(newStatus);
    onFilterChange({
      ...newFilter,
      ...getDistributionStatusFilter(newStatus),
    });
  };

  const onDistributionStatusChange = (
    _event: unknown,
    newValue: DistributionStatus
  ) => changeDistributionStatus(newValue);

  const clearDistributionStatusFilter = () => changeDistributionStatus(null);

  const getUnitsStatusFilter = (status: UnitsStatus | null): Pool_Filter => {
    switch (status) {
      case UnitsStatus.Issued:
        return { totalUnits_gt: "0" };
      case UnitsStatus.NotIssued:
        return { totalUnits: "0" };
      default:
        return {};
    }
  };

  const changeUnitsStatus = (newStatus: UnitsStatus | null) => {
    const { totalUnits_gt, totalUnits, ...newFilter } = queryArg.filter;

    setUnitsStatus(newStatus);
    onFilterChange({
      ...newFilter,
      ...getUnitsStatusFilter(newStatus),
    });
  };

  const onUnitsStatusChange = (_event: unknown, newStatus: UnitsStatus) =>
    changeUnitsStatus(newStatus);

  const clearUnitsStatusFilter = () => changeUnitsStatus(null);

  const clearFilterField =
    (...fields: Array<keyof Pool_Filter>) =>
    () =>
      onFilterChange(omit(fields, queryArg.filter));

  const openFilter = () => setShowFilterMenu(true);
  const closeFilter = () => setShowFilterMenu(false);

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    closeFilter();
  };

  const resetFilter = () => {
    setDistributionStatus(null);
    setUnitsStatus(null);
    onFilterChange(defaultFilter);
    closeFilter();
  };

  const tableRows = queryResult.data?.data || [];
  const hasNextPage = !!queryResult.data?.nextPaging;

  const { filter, order, pagination } = queryArg;

  const {
    skip = publishedPoolPagingDefault.skip,
    take = publishedPoolPagingDefault.take,
  } = queryResult.data?.paging || {};

  return (
    <>
      <Toolbar sx={{ mt: 3, px: 1 }} variant="dense" disableGutters>
        <Typography sx={{ flex: "1 1 100%" }} variant="h6" component="h2">
          Pools
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mx: 2 }}>
          {filter.id && (
            <Chip
              label={
                <>
                  ID: <b data-cy={"chip-id"}>{filter.id}</b>
                </>
              }
              size="small"
              onDelete={clearFilterField("id")}
            />
          )}

          {distributionStatus !== null && (
            <Chip
              data-cy={"chip-distributed"}
              label={
                distributionStatus === DistributionStatus.Distributed
                  ? "Has distributed tokens"
                  : "Has not distributed tokens"
              }
              size="small"
              onDelete={clearDistributionStatusFilter}
            />
          )}

          {unitsStatus !== null && (
            <Chip
              data-cy={"chip-units"}
              label={
                unitsStatus === UnitsStatus.Issued
                  ? "Has issued units"
                  : "Has not issued units"
              }
              size="small"
              onDelete={clearUnitsStatusFilter}
            />
          )}
        </Stack>

        <Tooltip disableFocusListener title="Filter">
          <IconButton data-cy={"pools-filter"} ref={filterAnchorRef} onClick={openFilter}>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        <Popover
          open={showFilterMenu}
          anchorEl={filterAnchorRef.current}
          onClose={closeFilter}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Stack
            sx={{ p: 3, pb: 2, minWidth: "300px" }}
            component="form"
            onSubmit={onFormSubmit}
            noValidate
            spacing={2}
          >
            <Box>
              <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                Pool Address
              </Typography>
              <OutlinedInput
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0 }}
                value={filter.id || ""}
                onChange={onPoolIdChange}
                data-cy={"id-input"}
                endAdornment={
                  filter.id && (
                    <ClearInputAdornment
                      onClick={clearFilterField("id")}
                    />
                  )
                }
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                Has distributed?
              </Typography>

              <ToggleButtonGroup
                size="small"
                exclusive
                fullWidth
                value={distributionStatus}
                onChange={onDistributionStatusChange}
              >
                <ToggleButton data-cy={"filter-distributed-yes"} value={DistributionStatus.Distributed}>
                  Yes
                </ToggleButton>
                <ToggleButton data-cy={"filter-distributed-no"} value={DistributionStatus.NotDistributed}>
                  No
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                Has issued units?
              </Typography>

              <ToggleButtonGroup
                size="small"
                exclusive
                fullWidth
                value={unitsStatus}
                onChange={onUnitsStatusChange}
              >
                <ToggleButton data-cy={"filter-issued-yes"} value={UnitsStatus.Issued}>Yes</ToggleButton>
                <ToggleButton data-cy={"filter-issued-no"} value={UnitsStatus.NotIssued}>No</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              {(filter.id ||
                distributionStatus !== null ||
                unitsStatus !== null) && (
                <Button data-cy={"reset-filter"} onClick={resetFilter} tabIndex={-1}>
                  Reset
                </Button>
              )}
              <Button data-cy={"close-filter"} type="submit" tabIndex={-1}>
                Close
              </Button>
            </Stack>
          </Stack>
        </Popover>
      </Toolbar>
      <Table sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell>Pool ID</TableCell>
            <TableCell>
              <TableSortLabel
                active={
                  order?.orderBy === "totalAmountDistributedUntilUpdatedAt"
                }
                direction={
                  order?.orderBy === "totalAmountDistributedUntilUpdatedAt"
                    ? order?.orderDirection
                    : "desc"
                }
                onClick={onSortClicked("totalAmountDistributedUntilUpdatedAt")}
              >
                Total Distributed
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={order?.orderBy === "totalUnits"}
                direction={
                  order?.orderBy === "totalUnits"
                    ? order?.orderDirection
                    : "desc"
                }
                onClick={onSortClicked("totalUnits")}
              >
                Total Units
                <InfoTooltipBtn
                  dataCy="gda-pool-table-total-units-tooltip"
                  title="The sum of total pending and approved units issued to members."
                  iconSx={{ mb: 0, mr: 0.5 }}
                />
              </TableSortLabel>
            </TableCell>
            <TableCell width="140px">
              <TableSortLabel
                active={order?.orderBy === "updatedAtTimestamp"}
                direction={
                  order?.orderBy === "updatedAtTimestamp"
                    ? order?.orderDirection
                    : "desc"
                }
                onClick={onSortClicked("updatedAtTimestamp")}
              >
                Created
              </TableSortLabel>
            </TableCell>
            <TableCell width="68px" />
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows.map((pool: Pool) => (
            <TableRow key={pool.id} hover>
              <TableCell data-cy={"publications-pool-id"}>
                {pool.id}
              </TableCell>
              <TableCell data-cy={"publications-total-distributed"}>
                <BalanceWithToken
                  wei={pool.totalAmountDistributedUntilUpdatedAt}
                  network={network}
                  tokenAddress={pool.token}
                />
              </TableCell>
              <TableCell data-cy={"publications-units"}>
                {pool.totalUnits}
              </TableCell>
              <TableCell>
                <TimeAgo
                  subgraphTime={pool.createdAtTimestamp}
                  typographyProps={{ typography: "body2" }}
                />
              </TableCell>

              <TableCell data-cy={"publications-details-buttons"} align="right">
                <PoolPublicationDetailsDialog
                  network={network}
                  id={pool.id.toString()}
                >
                  {(onClick) => <DetailsButton onClick={onClick} />}
                </PoolPublicationDetailsDialog>
              </TableCell>
            </TableRow>
          ))}

          {queryResult.isSuccess && tableRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                sx={{ border: 0, height: "96px" }}
                align="center"
              >
                <Typography data-cy={"publications-no-results"} variant="body1">
                  No results
                </Typography>
              </TableCell>
            </TableRow>
          )}

          <TableLoader
            isLoading={queryResult.isLoading || queryResult.isFetching}
            showSpacer={tableRows.length === 0}
          />
        </TableBody>
        {tableRows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} align="right">
                <InfinitePagination
                  page={skip / take + 1}
                  pageSize={pagination.take}
                  isLoading={queryResult.isFetching}
                  hasNext={hasNextPage}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  sx={{ justifyContent: "flex-end" }}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </>
  );
};

export default AccountPublishedPoolsTable;
