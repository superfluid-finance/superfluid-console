import { FC, ReactElement } from 'react'

import AppLink from '../../../components/AppLink/AppLink'
import HelpAlert from '../../../components/Info/HelpAlert'
import AccountTokenSnapshotTable from '../../../components/Table/Account/AccountTokenSnapshotTable'
import { Network } from '../../../redux/networks'

const AccountTokens: FC<{
  network: Network
  accountAddress: string
}> = ({ network, accountAddress }): ReactElement => {
  return (
    <>
      <HelpAlert sx={{ mb: 3 }}>
        A super token is either a wrapper around existing ERC20 token or a
        custom token that has special properties which allow them to be streamed
        and distributed to many accounts at the same time.{' '}
        <AppLink
          href="https://docs.superfluid.finance/superfluid/protocol-developers/guides/super-tokens"
          target="_blank"
        >
          Read more
        </AppLink>
      </HelpAlert>

      <AccountTokenSnapshotTable
        network={network}
        accountAddress={accountAddress}
      />
    </>
  )
}

export default AccountTokens
