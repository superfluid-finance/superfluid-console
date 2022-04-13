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
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  createSkipPaging,
  Ordering,
  Token_Filter,
  Token_OrderBy,
} from "@superfluid-finance/sdk-core";
import { TokensQuery } from "@superfluid-finance/sdk-redux";
import isEqual from "lodash/fp/isEqual";
import omit from "lodash/fp/omit";
import set from "lodash/fp/set";
import { ChangeEvent, FC, FormEvent, useEffect, useRef, useState } from "react";
import useDebounce from "../../hooks/useDebounce";
import { Network } from "../../redux/networks";
import { sfSubgraph } from "../../redux/store";
import AppLink from "../AppLink";
import ClearInputAdornment from "../ClearInputAdornment";
import InfinitePagination from "../InfinitePagination";
import TableLoader from "../TableLoader";

export enum ListedStatus {
  Listed,
  NotListed,
}

interface SuperTokensTableProps {
  network: Network;
}

const defaultOrdering = {} as Ordering<Token_OrderBy>;

const defaultFilter: Token_Filter = {};

export const defaultPaging = createSkipPaging({
  take: 10,
});

const SuperTokensTable: FC<SuperTokensTableProps> = ({ network }) => {
  const filterAnchorRef = useRef(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [listedStatus, setListedStatus] = useState<ListedStatus | null>(null);

  const createDefaultArg = (): Required<TokensQuery> => ({
    chainId: network.chainId,
    filter: defaultFilter,
    pagination: defaultPaging,
    order: defaultOrdering,
  });

  const [queryArg, setQueryArg] = useState<Required<TokensQuery>>(
    createDefaultArg()
  );

  const [queryTrigger, queryResult] = sfSubgraph.useLazyTokensQuery();

  const queryTriggerDebounced = useDebounce(queryTrigger, 250);

  const onQueryArgsChanged = (newArgs: Required<TokensQuery>) => {
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
    onQueryArgsChanged(createDefaultArg());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network]);

  const setPage = (newPage: number) =>
    onQueryArgsChanged(
      set("pagination.skip", (newPage - 1) * queryArg.pagination.take, queryArg)
    );

  const setPageSize = (newPageSize: number) =>
    onQueryArgsChanged(set("pagination.take", newPageSize, queryArg));

  const onFilterChange = (newFilter: Token_Filter) => {
    onQueryArgsChanged({
      ...queryArg,
      pagination: { ...queryArg.pagination, skip: 0 },
      filter: newFilter,
    });
  };

  const clearFilterField =
    (...fields: Array<keyof Token_Filter>) =>
    () =>
      onFilterChange(omit(fields, queryArg.filter));

  const onNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onFilterChange({
        ...queryArg.filter,
        name_contains: e.target.value,
      });
    } else {
      onFilterChange(omit("name_contains", queryArg.filter));
    }
  };

  const onSymbolChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onFilterChange({
        ...queryArg.filter,
        symbol_contains: e.target.value,
      });
    } else {
      onFilterChange(omit("symbol_contains", queryArg.filter));
    }
  };

  const getListedStatusFilter = (status: ListedStatus | null): Token_Filter => {
    switch (status) {
      case ListedStatus.Listed:
        return { isListed: true };
      case ListedStatus.NotListed:
        return { isListed: false };
      default:
        return {};
    }
  };

  const changeListedStatus = (newStatus: ListedStatus | null) => {
    const { isListed, ...newFilter } = queryArg.filter;

    setListedStatus(newStatus);
    onFilterChange({
      ...newFilter,
      ...getListedStatusFilter(newStatus),
    });
  };

  const onListedStatusChange = (_event: unknown, newStatus: ListedStatus) =>
    changeListedStatus(newStatus);

  const clearListedStatusFilter = () => changeListedStatus(null);

  const openFilter = () => setShowFilterMenu(true);
  const closeFilter = () => setShowFilterMenu(false);

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    closeFilter();
  };

  const resetFilter = () => {
    clearListedStatusFilter();
    onFilterChange(defaultFilter);
    closeFilter();
  };

  const hasNextPage = !!queryResult.data?.nextPaging;

  const tokens = queryResult.data?.data || [];

  const { filter, order, pagination } = queryArg;

  const { skip = defaultPaging.skip, take = defaultPaging.take } =
    queryResult.data?.paging || {};

  return (
    <>
      <Toolbar sx={{ px: 1 }} variant="dense" disableGutters>
        <Typography sx={{ flex: "1 1 100%" }} variant="h6" component="h2">
          Super tokens
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mx: 2 }}>
          {filter.name_contains && (
            <Chip
              label={
                <>
                  Name: <b>{filter.name_contains}</b>
                </>
              }
              size="small"
              onDelete={clearFilterField("name_contains")}
            />
          )}

          {filter.symbol_contains && (
            <Chip
              label={
                <>
                  Symbol: <b>{filter.symbol_contains}</b>
                </>
              }
              size="small"
              onDelete={clearFilterField("symbol_contains")}
            />
          )}

          {listedStatus !== null && (
            <Chip
              label={
                <>
                  Listed:{" "}
                  <b>{listedStatus === ListedStatus.Listed ? "Yes" : "No"}</b>
                </>
              }
              size="small"
              onDelete={clearListedStatusFilter}
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
                Token name
              </Typography>
              <OutlinedInput
                autoFocus
                fullWidth
                size="small"
                value={filter.name_contains || ""}
                onChange={onNameChange}
                endAdornment={
                  filter.name_contains && (
                    <ClearInputAdornment
                      onClick={clearFilterField("name_contains")}
                    />
                  )
                }
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                Token symbol
              </Typography>
              <OutlinedInput
                fullWidth
                size="small"
                value={filter.symbol_contains || ""}
                onChange={onSymbolChange}
                endAdornment={
                  filter.symbol_contains && (
                    <ClearInputAdornment
                      onClick={clearFilterField("symbol_contains")}
                    />
                  )
                }
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                Is token listed?
              </Typography>

              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={listedStatus}
                onChange={onListedStatusChange}
              >
                <ToggleButton value={ListedStatus.Listed}>Yes</ToggleButton>
                <ToggleButton value={ListedStatus.NotListed}>No</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              {filter.name_contains && (
                <Button onClick={resetFilter} tabIndex={-1}>
                  Reset
                </Button>
              )}
              <Button type="submit" tabIndex={-1}>
                Close
              </Button>
            </Stack>
          </Stack>
        </Popover>
      </Toolbar>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width="40%">Token name</TableCell>
            <TableCell width="20%">Symbol</TableCell>
            <TableCell width="20%">Listed</TableCell>
            <TableCell width="40%">Address</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tokens.map((token) => (
            <TableRow key={token.id}>
              <TableCell>
                <AppLink href={`/${network.slugName}/supertokens/${token.id}`}>
                  {token.name}
                </AppLink>
              </TableCell>
              <TableCell>
                <AppLink
                  href={`/${network.slugName}/supertokens/${token.id}`}
                  sx={{ textDecoration: "none", flexShrink: 0 }}
                >
                  <Chip
                    clickable
                    size="small"
                    label={token.symbol}
                    sx={{ cursor: "pointer", lineHeight: "24px" }}
                  />
                </AppLink>
              </TableCell>
              <TableCell>{token.isListed ? "Yes" : "No"}</TableCell>
              <TableCell>{token.id}</TableCell>
            </TableRow>
          ))}

          {queryResult.isSuccess && tokens.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3}
                sx={{ border: 0, height: "96px" }}
                align="center"
              >
                <Typography variant="body1">No results</Typography>
              </TableCell>
            </TableRow>
          )}

          <TableLoader
            isLoading={queryResult.isLoading || queryResult.isFetching}
            showSpacer={tokens.length === 0}
          />
        </TableBody>

        {tokens.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} align="right">
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

export default SuperTokensTable;