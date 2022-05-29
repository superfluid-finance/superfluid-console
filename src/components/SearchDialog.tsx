import { FC, useEffect, useState } from "react";
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
import { addressBookSelectors } from "../redux/slices/addressBook.slice";
import { searchBarPlaceholderText } from "./SearchBar";
import { useSearch } from "../hooks/useSearch";
import ConnectCeramicButton, { useLoadAddressBook } from "./ConnectCeramicButton";

const SearchDialog: FC<{ open: boolean; close: () => void }> = ({
  open,
  close,
}) => {
  const addressBookEntries = useAppSelector((state) =>
    addressBookSelectors.selectAll(state)
  );

  const handleClose = () => {
    close();
    // Give it a second to clear the inputs so the data wouldn't instantly jump for the user (before dialog disappeared).
    setTimeout(() => {
      setSearchTermVisible("");
      _setSearchTermDebounced("");
    }, 50);
  };

  const router = useRouter();

  const [searchTermVisible, setSearchTermVisible] = useState("");
  const [searchTermDebounced, _setSearchTermDebounced] =
    useState(searchTermVisible);

  const [setSearchTermDebounced] = useState(() =>
    _.debounce((searchTerm) => {
      _setSearchTermDebounced(searchTerm);
    }, 250)
  );

  const setSearchTerm = (searchTerm: string) => {
    setSearchTermVisible(searchTerm);
    setSearchTermDebounced(searchTerm.trim());
  };

  const networkSearchResults = useSearch(searchTermDebounced);

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
                {networkSearchResults.some((x) => x.isFetching) ? (
                  <CircularProgress
                    data-cy={"search-loading-spinner"}
                    size={24}
                    sx={{ color: "text.secondary" }}
                  />
                ) : (
                  <SearchIcon />
                )}
              </InputAdornment>
            ),
          }}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
        />

        <ConnectCeramicButton />
        {networkSearchResults
          .filter((x) => x.tokens.length || x.accounts.length)
          .map((x) => (
            <Card sx={{ mt: 2 }} component="section" key={x.network.chainId}>
              <Typography sx={{ p: 1 }} variant="subtitle2" component="h3">
                <NetworkFormatted network={x.network} />
              </Typography>
              <Divider />
              {x.error ? (
                <QueryError error={x.error} />
              ) : (
                <List disablePadding>
                  {x.accounts.map((account) => (
                    <ListItem
                      data-cy={x.network.slugName + "-account-search-result"}
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
                      data-cy={x.network.slugName + "-token-search-result"}
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
          ))}

        {!!addressBookEntries.length && (
          <Divider sx={{ my: 3, borderWidth: 1.25 }} />
        )}

        {addressBookEntries.length ? (
          <Card sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ m: 1 }} component="h3">
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
                      data-cy={"address-book-entry"}
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
