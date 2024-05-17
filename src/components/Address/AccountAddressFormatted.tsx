import { ethers } from 'ethers'
import { FC } from 'react'

import { useAppSelector } from '../../redux/hooks'
import { Network } from '../../redux/networks'
import {
  addressBookSelectors,
  createEntryId
} from '../../redux/slices/addressBook.slice'
import ellipsisAddress from '../../utils/ellipsisAddress'
import { useAddress } from '../../hooks/useAddressDisplay'

export const AccountAddressFormatted: FC<{
  network: Network
  address: string
  ellipsis?: number
  format?: 'nameOnly' | 'addressPlusName' | 'namePlusAddress'
}> = ({ network, address, ellipsis, format = 'nameOnly' }) => {
  const addressBookEntry = useAppSelector((state) =>
    addressBookSelectors.selectById(state, createEntryId(network, address))
  )
  const {ensName: name} = useAddress(address, false);

  const parsedAddress = ellipsis
    ? ellipsisAddress(ethers.utils.getAddress(address), ellipsis)
    : ethers.utils.getAddress(address)

  if (format === 'addressPlusName') {
    return (
      <>
        {parsedAddress}
        {!!name && ` (${name})`}
        {!!addressBookEntry?.nameTag && ` (${addressBookEntry.nameTag})`}
      </>
    )
  }

  if (format === 'namePlusAddress') {
    if (!addressBookEntry?.nameTag || !name) {
      return <>{parsedAddress}</>
    } else {
      return (
        <>
          {addressBookEntry.nameTag} ({parsedAddress})
        </>
      )
    }
  }

  // "nameOnly" is default
  return <>{addressBookEntry?.nameTag || name || parsedAddress}</>
}
