import urlcat from 'urlcat'
import { ethers } from "ethers";
import { createApi,  fakeBaseQuery } from "@reduxjs/toolkit/query/react";

export interface NameInfo {
  rnsName: string
  ensName: string | null
  address: string
}

export interface ProfileInfo {
  avatar: string[]
  bio: string
  name: string
}

interface RSS3Info {
  profile: ProfileInfo
}


export const getNameById = async (id: string ) => {
  if (!id) return ''
    const url = urlcat('https://rss3.domains/address/:id', { id })
    const rsp = (await (await fetch(url)).json()) as NameInfo
    return rsp.ensName
}

export const getAddressByName = async (id: string) => {
  if (!id) return ''
  const url = urlcat('https://rss3.domains/name/:id', { id })
  const rsp = (await (await fetch(url)).json()) as NameInfo
  return rsp.address
}


export const getUserAvatar = async (address: string) => {
  if (!address) return ''
  const url = urlcat('https://hub.pass3.me/:address', { address })
  const rsp = (await (await fetch(url)).json()) as  RSS3Info
  return rsp.profile

}


export const ensApi = createApi({
  reducerPath: "ens",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => {

    const mainnetProvider = new ethers.providers.InfuraProvider(
      "mainnet",
      "c44fac7726a64d5bbbb3a1c51f02d75b"
    );

    return {
      resolveName: builder.query<
        { address: string; name: string } | null,
        string
      >({
        queryFn: async (name) => {
          if (ethers.utils.isAddress(name)) {
            return { data: null };
          }

          if (!name.endsWith('.eth')) {
            return { data: null };
          }

          const address = await getAddressByName(name) || await mainnetProvider.resolveName(name)
          return {
            data: address
              ? {
                  name,
                  address: address,

                }
              : null,
          };
        },
      }),
      lookupAddress: builder.query<
        { address: string; name: string } | null,
        string
      >({
        queryFn: async (address) => {
          const name = await mainnetProvider.lookupAddress(address) ?? await getNameById(address)
          return {
            data: name
              ? {
                  name,
                  address: ethers.utils.getAddress(address),
                }
              : null,
          };
        },
      }),
      lookupAvatar: builder.query<
      { address: string; avatar: string } | null,
      string>({
        queryFn: async (address) => {
          const dataAvatar = await getUserAvatar(address)
          return {
            data: dataAvatar ? {
              address,
              avatar: dataAvatar?.avatar[0]
            }
            : null,
          }
        }
      })
    };
  },
});
