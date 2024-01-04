import React, { useContext } from 'react'

import { Network } from '../redux/networks'

// TODO: remove when GDA deployed to all the networks
export const NetworkContext = React.createContext<Network
// & { hasGDA: boolean; }
>(null!)

export const useNetworkContext = () => useContext(NetworkContext)
