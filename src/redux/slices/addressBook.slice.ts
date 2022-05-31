import {
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'
import { Network } from '../networks';
import {RootState} from "../store";
import {REHYDRATE} from "redux-persist";

export interface AddressBookEntry {
  chainId: number,
  address: string,
  nameTag: string
}

export const createEntryId = (network: Network, address: string) => (`${network.chainId}_${address.toLowerCase()}`);

export const getEntryId = (addressBookEntry: AddressBookEntry) => {
  return `${addressBookEntry.chainId}_${addressBookEntry.address.toLowerCase()}`;
}

export const addressBookAdapter = createEntityAdapter({
  selectId: (entry: AddressBookEntry) => getEntryId(entry),
})

const sliceName = 'addressBook';

export const addressBookSlice = createSlice({
  name: sliceName,
  initialState: addressBookAdapter.getInitialState({
    isUploading: false,
  }),
  reducers: {
    entryUpserted: addressBookAdapter.upsertOne,
    entryUpsertedMany: addressBookAdapter.upsertMany,
    entryRemoved: addressBookAdapter.removeOne,
    startUploading(state) {
      state.isUploading = true;
    },
    endUploading(state) {
      state.isUploading = false;
    },
  },
  extraReducers: {
    [REHYDRATE]: (state, {payload}) => ({
      ...state,
      ...(payload ? payload[sliceName] : {}),
    }),
  },
})

export const addressBookSelectors = addressBookAdapter.getSelectors((state: RootState) => state.addressBook)

