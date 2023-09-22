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
  Typography
} from "@mui/material";
import {
  createSkipPaging,
  Ordering
} from "@superfluid-finance/sdk-core";
import { IndexesQuery } from "@superfluid-finance/sdk-redux";
import omit from "lodash/fp/omit";
import set from "lodash/fp/set";
import isEqual from "lodash/isEqual";
import { ChangeEvent, FC, FormEvent, useEffect, useRef, useState } from "react";
import useDebounce from "../../../hooks/useDebounce";
import { Network } from "../../../redux/networks";
import AccountAddress from "../../AccountAddress";
import AppLink from "../../AppLink";
import BalanceWithToken from "../../BalanceWithToken";
import ClearInputAdornment from "../../ClearInputAdornment";
import DetailsButton from "../../DetailsButton";
import { IndexPublicationDetailsDialog } from "../../IndexPublicationDetails";
import InfinitePagination from "../../InfinitePagination";
import InfoTooltipBtn from "../../InfoTooltipBtn";
import TableLoader from "../../TableLoader";
import { DistributionStatus } from "../Account/AccountPublishedIndexesTable";
import { PoolsQuery } from "../../../gda-subgraph/endpoints/entityArgs";
import { sfGdaSubgraph } from "../../../redux/store";
import { Pool_Filter, Pool_OrderBy } from "../../../gda-subgraph/.graphclient";
import { PoolPublicationDetailsDialog } from "../../PoolPublicationDetails";

const defaultOrdering = {
  orderBy: "createdAtTimestamp",
  orderDirection: "desc",
} as Ordering<Pool_OrderBy>;

export const defaultPaging = createSkipPaging({
  take: 10,
});

interface SuperTokenPoolsTableProps {
  network: Network;
  tokenAddress: string;
}

type RequiredPoolsQuery = Required<Omit<PoolsQuery, "block">>;

const SuperTokenPoolsTable: FC<SuperTokenPoolsTableProps> = ({
  network,
  tokenAddress,
}) => {
  const filterAnchorRef = useRef(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [distributionStatus, setDistributionStatus] =
    useState<DistributionStatus | null>(null);

  const defaultFilter = {
    token: tokenAddress,
  };

  const createDefaultArg = (): RequiredPoolsQuery => ({
    chainId: network.chainId,
    filter: defaultFilter,
    pagination: defaultPaging,
    order: defaultOrdering,
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
  }, [network, tokenAddress]);

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
      onOrderingChanged(defaultOrdering);
    }
  };

  const onFilterChange = (newFilter: Pool_Filter) =>
    onQueryArgChanged({
      ...queryArg,
      pagination: { ...queryArg.pagination, skip: 0 },
      filter: newFilter,
    });

  const onStringFilterChange =
    (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
        onFilterChange({
          ...queryArg.filter,
          [field]: e.target.value.toLowerCase(),
        });
      } else {
        onFilterChange(omit(field, queryArg.filter));
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
    onFilterChange(defaultFilter);
    closeFilter();
  };

  const tableRows = queryResult.data?.data || [];
  const hasNextPage = !!queryResult.data?.nextPaging;

  const { filter, order, pagination } = queryArg;

  const { skip = defaultPaging.skip, take = defaultPaging.take } =
    queryResult.data?.paging || {};

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
                  Index ID: <b data-cy={"chip-id"} >{filter.id}</b>
                </>
              }
              size="small"
              onDelete={clearFilterField("id")}
            />
          )}

          {filter.admin_contains && (
            <Chip
              label={
                <>
                  Admin: <b data-cy={"chip-admin"}>{filter.admin_contains}</b>
                </>
              }
              size="small"
              onDelete={clearFilterField("admin_contains")}
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
        </Stack>

        <Tooltip disableFocusListener title="Filter">
          <IconButton ref={filterAnchorRef} onClick={openFilter}>
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
                onChange={onStringFilterChange("id")}
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
                Admin address
              </Typography>
              <OutlinedInput
                fullWidth
                size="small"
                inputProps={{ min: 0 }}
                value={filter.admin_contains || ""}
                onChange={onStringFilterChange("admin_contains")}
                data-cy={"admin-address-input"}
                endAdornment={
                  filter.admin_contains && (
                    <ClearInputAdornment
                      onClick={clearFilterField("admin_contains")}
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

            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              {(filter.id ||
                filter.admin_contains ||
                distributionStatus !== null) && (
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
            <TableCell width="160px">Pool Address</TableCell>
            <TableCell>
              Admin
              <InfoTooltipBtn
                title={
                  <>
                    The creator of an pool using the IDA - admins may
                    update the pool of subscribers and distribute funds to
                    subscribers.{" "}
                    <AppLink
                      href="https://docs.superfluid.finance/superfluid/protocol-developers/interactive-tutorials/instant-distribution"
                      target="_blank"
                    >
                      Read more
                    </AppLink>
                  </>
                }
                iconSx={{ mb: 0, mr: 0.5 }}
              />
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={
                  order.orderBy === "totalAmountDistributedUntilUpdatedAt"
                }
                direction={
                  order.orderBy === "totalAmountDistributedUntilUpdatedAt"
                    ? order.orderDirection
                    : "desc"
                }
                onClick={onSortClicked("totalAmountDistributedUntilUpdatedAt")}
              >
                Total Distributed
              </TableSortLabel>
            </TableCell>
            <TableCell width="220px">
              <TableSortLabel
                active={order.orderBy === "createdAtTimestamp"}
                direction={
                  order.orderBy === "createdAtTimestamp"
                    ? order.orderDirection
                    : "desc"
                }
                onClick={onSortClicked("createdAtTimestamp")}
              >
                Created
              </TableSortLabel>
            </TableCell>
            <TableCell width="68px" />
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows.map((pool) => (
            <TableRow key={pool.id} hover>
              <TableCell data-cy={"pool-id"}>{pool.id}</TableCell>
              <TableCell>
                <AccountAddress
                  dataCy={"admin"}
                  network={network}
                  address={pool.admin}
                  ellipsis={6}
                />
              </TableCell>
              <TableCell data-cy={"total-distributed"}>
                <BalanceWithToken
                  wei={pool.totalAmountDistributedUntilUpdatedAt.toString()}
                  network={network}
                  tokenAddress={pool.token}
                />
              </TableCell>
              <TableCell>
                {new Date(pool.createdAtTimestamp * 1000).toLocaleString()}
              </TableCell>

              <TableCell align="right">
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
                <Typography data-cy={"no-results"} variant="body1">No results</Typography>
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

export default SuperTokenPoolsTable;
