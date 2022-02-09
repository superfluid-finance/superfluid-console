import { FC, useCallback, useEffect, useState } from "react";
import {
  TextField,
  Typography,
  DialogContent,
  Dialog,
  InputAdornment,
  ListItem,
  List,
  ListItemButton,
  CircularProgress,
  Grid,
  Card,
  Divider,
  ListItemText,
} from "@mui/material";
import { useRouter } from "next/router";
import SearchIcon from "@mui/icons-material/Search";
import AccountAddress, { AccountAddressFormatted } from "./AccountAddress";
import { SuperTokenFormatted } from "./SuperTokenAddress";
import QueryError from "./QueryError";
import _ from "lodash";
import NextLink from "next/link";
import NetworkFormatted from "./NetworkDisplay";
import { networksByChainId } from "../redux/networks";
import { useAppSelector } from "../redux/hooks";
import { searchHistorySelectors } from "../redux/slices/searchHistory.slice";
import { timeAgo } from "../utils/dateTime";
import { addressBookSelectors } from "../redux/slices/addressBook.slice";
import { searchBarPlaceholderText } from "./SearchBar";
import { useSearch } from "../hooks/useSearchHook";

const SearchDialog: FC<{ open: boolean; close: () => void }> = ({
  open,
  close,
}) => {
  const lastSearches = useAppSelector((state) =>
    searchHistorySelectors.selectAll(state)
  ).slice(0, 5);

  const addressBookEntries = useAppSelector((state) =>
    addressBookSelectors.selectAll(state)
  );

  const handleClose = () => {
    close();
    setSearchTermVisible("");
  };

  const router = useRouter();

  const [searchTermVisible, setSearchTermVisible] = useState("");
  const [searchTermDebounced, _setSearchTermDebounced] = useState(searchTermVisible);

  const [setSearchTermDebounced] = useState(() =>
    _.debounce((searchTerm) => {
      _setSearchTermDebounced(searchTerm);
    }, 250)
  );

  const networkSearchResults = useSearch(searchTermDebounced.trim());

  useEffect(() => {
    const handleRouteChange = () => {
      handleClose();
    };

    router.events.on("routeChangeStart", handleRouteChange);

    // If the component is unmounted, unsubscribe
    // from the event with the `off` method:
    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, []);

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      onClose={handleClose}
      open={open}
      sx={{ verticalAlign: "top" }}
    >
      <DialogContent>
        <TextField
          sx={{
            mt: 1,
          }}
          variant="outlined"
          label="Search"
          placeholder={searchBarPlaceholderText}
          autoFocus
          fullWidth
          id="outlined-search"
          type="search"
          value={searchTermVisible}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          onChange={(e) => {
            setSearchTermVisible(e.currentTarget.value);
            setSearchTermDebounced(e.currentTarget.value);
          }}
        />
        {!networkSearchResults.length && lastSearches.length ? (
          <Card sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ m: 1 }}>
              Last Searches
            </Typography>
            <Divider />
            <List>
              {lastSearches.map((lastSearch) => (
                <ListItem key={lastSearch.address} disablePadding>
                  <ListItemButton>
                    <ListItemText
                      primary={`${lastSearch.address} (${timeAgo(
                        lastSearch.timestamp
                      )})`}
                      onClick={() => setSearchTermVisible(lastSearch.address)}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Card>
        ) : networkSearchResults.some((x) => x.isFetching) ? (
          <Grid container justifyContent="center" sx={{ mt: 3 }}>
            <CircularProgress />
          </Grid>
        ) : (
          networkSearchResults
            .filter((x) => x.tokens.length || x.accounts.length)
            .map((x) => (
              <Card sx={{ mt: 2 }} component="section" key={x.network.chainId}>
                <Typography sx={{ p: 1 }} variant="subtitle1" component="h3">
                  <NetworkFormatted network={x.network} />
                </Typography>
                <Divider />
                {x.error ? (
                  <QueryError error={x.error} />
                ) : (
                  <List disablePadding>
                    {x.accounts.map((account) => (
                      <ListItem
                        disablePadding
                        sx={{ pt: 0.5, pb: 0.5 }}
                        key={`${x.network.chainId}_${account.id}`}
                      >
                        <NextLink
                          href={`/${x.network.slugName}/accounts/${account.id}`}
                          passHref
                        >
                          <ListItemButton component="a">
                            <AccountAddressFormatted
                              network={x.network}
                              address={account.id}
                            />
                          </ListItemButton>
                        </NextLink>
                      </ListItem>
                    ))}
                    {x.tokens.map((token) => (
                      <ListItem
                        disablePadding
                        sx={{ mt: 1, mb: 1 }}
                        key={`${x.network.chainId}_${token.id}`}
                      >
                        <NextLink
                          href={`/${x.network.slugName}/supertokens/${token.id}`}
                          passHref
                        >
                          <ListItemButton component="a">
                            <SuperTokenFormatted
                              name={token.name}
                              symbol={token.symbol}
                              address={token.id}
                              isListed={token.isListed}
                            />
                          </ListItemButton>
                        </NextLink>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Card>
            ))
        )}
        {!networkSearchResults.length && addressBookEntries.length ? (
          <Card sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ m: 1 }}>
              Address Book
            </Typography>
            <Divider />
            <List>
              {addressBookEntries.map((entry) => (
                <ListItem
                  key={`${entry.chainId}_${entry.address}`}
                  disablePadding
                >
                  <ListItemButton>
                    <ListItemText
                      primary={
                        <AccountAddress
                          network={networksByChainId.get(entry.chainId)!}
                          address={entry.address}
                        />
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Card>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;