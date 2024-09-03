import { Chip, ChipProps } from '@mui/material'
import { FC } from 'react'

import { Network } from '../../redux/networks'
import AppLink from '../AppLink/AppLink'
import { useTokenQuery } from '../../hooks/useTokenQuery'

export interface TokenChipProps {
  network: Network
  tokenAddress: string
  ChipProps?: ChipProps
}

const TokenChip: FC<TokenChipProps> = ({
  network,
  tokenAddress,
  ChipProps = { sx: {} }
}) => {
  const tokenQuery = useTokenQuery({
    chainId: network.chainId,
    id: tokenAddress
  })

  if (!tokenQuery.data) return null

  return (
    <AppLink
      data-cy={'token-link'}
      href={`/${network.slugName}/supertokens/${tokenAddress}`}
      sx={{ textDecoration: 'none', flexShrink: 0 }}
    >
      <Chip
        clickable
        size="small"
        label={tokenQuery.data.symbol}
        sx={{ cursor: 'pointer', lineHeight: '24px', ...ChipProps.sx }}
        {...ChipProps}
      />
    </AppLink>
  )
}

export default TokenChip
