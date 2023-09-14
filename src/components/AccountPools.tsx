import { FC, ReactElement } from "react";
import { Network } from "../redux/networks";
import AppLink from "./AppLink";
import HelpAlert from "./HelpAlert";
import AccountPublishedPoolsTable from "./Tables/Account/AccountPublishedPoolsTable";
import AccountPoolSubscriptionsTable from "./Tables/Account/AccountPoolSubscriptionsTable";

const AccountPools: FC<{
  network: Network;
  accountAddress: string;
}> = ({ network, accountAddress }): ReactElement => {
  return (
    <>
      <HelpAlert>
      The GDA introduces a new primitive which enables one-to-many Superfluid streaming distributions, becoming the most scalable way to distribute recurring funds to a limitless set of recipients in web3. (GDA).{" "}
        <AppLink
          href="https://docs.superfluid.finance/superfluid/protocol-overview/in-depth-overview/super-agreements/streaming-distributions-coming-soon"
          target="_blank"
        >
          Read more
        </AppLink>
      </HelpAlert>

      <AccountPublishedPoolsTable
        network={network}
        accountAddress={accountAddress}
      />

      <AccountPoolSubscriptionsTable
        network={network}
        accountAddress={accountAddress}
      />
    </>
  );
};

export default AccountPools;
