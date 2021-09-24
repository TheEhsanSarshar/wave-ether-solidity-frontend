import * as React from "react"
import { ethers } from "ethers"
import "./App.css"
import abiFile from "./utils/contractAbiFile.json"

type Wave = {
  waver: string
  timestamp: Date
  message: string
}

export default function App() {
  const [currentAccount, setCurrentAccount] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [state, setState] = React.useState({ state: "idle", totalWaves: null })
  const [allWaves, setAllWaves] = React.useState<Wave[]>([])
  const [message, setMessage] = React.useState("")

  const contractAddress = "0x90086c2edd5BFC74e97f8586a17DdE572F6Bd689"
  const contractABI = abiFile.abi

  const checkIfWalletIsConnected = async () => {
    //@ts-ignore
    const { ethereum } = window
    if (!ethereum) {
      alert("Make sure you have Metamask!")
      return
    } else {
      console.log("We have the ethereum ", ethereum)
    }

    try {
      let accounts = ethereum.request({ method: "eth_accounts" })
      if (accounts.length) {
        let account = accounts[0]
        setCurrentAccount(account)
      } else {
        console.log("we are not authorized")
      }
    } catch (e: any) {
      console.log(e.message)
    }
  }
  const wave = async () => {
    try {
      setState((prev) => ({ ...prev, state: "loading" }))
      //@ts-ignore
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      )
      let count = await wavePortalContract.getTotalWaves()
      let countTxn = await wavePortalContract.wave(message || "no message!", {
        gasLimit: 300000,
      })
      await countTxn.wait()
      count = await wavePortalContract.getTotalWaves()
      setState({ state: "idle", totalWaves: count.toNumber() })
    } catch (e: any) {
      console.log(e.message)
    }
  }

  const getAllWaves = async () => {
    // @ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const waveportalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    )
    let waves = (await waveportalContract.getAllWaves()) as Wave[]
    let wavesCleaned: Wave[] = []
    waves.forEach((wave: any) => {
      wavesCleaned.push({
        waver: wave.waver,
        timestamp: new Date(wave.timestamp * 1000),
        message: wave.message,
      })
    })

    setAllWaves(wavesCleaned)
    let event = waveportalContract.on("NewWave", (from, timestamp, message) => {
      setAllWaves((prev) => [
        ...prev,
        { waver: from, timestamp: new Date(timestamp * 1000), message },
      ])
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
  }

  React.useEffect(() => {
    if (currentAccount) {
      getAllWaves()
    }
  }, [currentAccount])

  const connectWallet = async () => {
    // @ts-ignore
    const { ethereum } = window
    if (!ethereum) {
      alert("Connect Metamask!")
      return
    }
    try {
      let accounts = await ethereum.request({ method: "eth_requestAccounts" })
      if (accounts.length) {
        setCurrentAccount(accounts[0])
      } else {
        console.log("no account found!")
      }
    } catch (e: any) {
      console.log(e.message)
    }
  }

  React.useEffect(() => {
    checkIfWalletIsConnected()
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">👋 Hey there!</div>

        <div className="bio">
          Hi, I am Ehsan! I am an experienced React, React Native and GraphQL
          developer.
        </div>
        {currentAccount ? (
          <>
            <input
              className="messageBox"
              placeholder="Please put your message in here"
              onChange={handleChange}
              value={message}
            />
            <button className="button waveButton" onClick={wave}>
              Wave at me!!
            </button>
          </>
        ) : null}
        {currentAccount ? null : (
          <button className="button connectButton" onClick={connectWallet}>
            Connect
          </button>
        )}
        {state.state === "loading" ? <h1>Loading ... </h1> : null}
        <div className="posts">
          {allWaves.map((wave, index) => {
            return (
              <div className="post">
                <h1 className="eachRow">
                  <span className="key">Address</span>
                  <span className="value">{wave.waver}</span>
                </h1>
                <h1 className="eachRow">
                  <span className="key">Time</span>
                  <span className="value">{wave.timestamp.toString()}</span>
                </h1>
                <h1 className="eachRow">
                  <span className="key">Message</span>
                  <span className="value">{wave.message}</span>
                </h1>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
