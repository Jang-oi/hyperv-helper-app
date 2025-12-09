

import { useState } from "react"
import { FadeInSection } from "../components/FadeInSection"

export default function NetworkPage() {
  const [ipConfig, setIpConfig] = useState({
    ip: "",
    subnet: "",
    gateway: "",
    dns: "",
  })

  const [hostname, setHostname] = useState("")
  const [proxyRules, setProxyRules] = useState([{ listenPort: "", connectAddress: "", connectPort: "" }])

  const handleApplyIP = () => {
    console.log("Applying IP configuration:", ipConfig)
    // Electron IPC call would go here
  }

  const handleApplyHostname = () => {
    console.log("Applying hostname:", hostname)
    // Electron IPC call would go here
  }

  const addProxyRule = () => {
    setProxyRules([...proxyRules, { listenPort: "", connectAddress: "", connectPort: "" }])
  }

  return (
    <div className="p-10 max-w-5xl mx-auto">
      {/* Current Status */}
      <FadeInSection delay={0}>
        <section className="mb-12">
          <h2 className="text-3xl font-serif font-light mb-6 text-amber-400">Current Status</h2>
          <div className="bg-stone-800/50 rounded-lg p-6 border border-white/5">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-stone-400 text-sm mb-1">Current IP Address</p>
                <p className="text-lg font-mono">192.168.1.100</p>
              </div>
              <div>
                <p className="text-stone-400 text-sm mb-1">Hostname</p>
                <p className="text-lg font-mono">DESKTOP-VM01</p>
              </div>
              <div>
                <p className="text-stone-400 text-sm mb-1">Gateway</p>
                <p className="text-lg font-mono">192.168.1.1</p>
              </div>
              <div>
                <p className="text-stone-400 text-sm mb-1">DNS Server</p>
                <p className="text-lg font-mono">8.8.8.8</p>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* IP Configuration */}
      <FadeInSection delay={0.1}>
        <section className="mb-12">
          <h2 className="text-3xl font-serif font-light mb-6 text-amber-400">IP Configuration</h2>
          <div className="bg-stone-800/50 rounded-lg p-8 border border-white/5">
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-stone-300 mb-2">IP Address</label>
                <input
                  type="text"
                  value={ipConfig.ip}
                  onChange={(e) => setIpConfig({ ...ipConfig, ip: e.target.value })}
                  placeholder="192.168.1.100"
                  className="w-full bg-stone-900 border border-stone-700 rounded px-4 py-3 text-stone-100 placeholder-stone-600 focus:border-amber-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-300 mb-2">Subnet Mask</label>
                <input
                  type="text"
                  value={ipConfig.subnet}
                  onChange={(e) => setIpConfig({ ...ipConfig, subnet: e.target.value })}
                  placeholder="255.255.255.0"
                  className="w-full bg-stone-900 border border-stone-700 rounded px-4 py-3 text-stone-100 placeholder-stone-600 focus:border-amber-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-300 mb-2">Default Gateway</label>
                <input
                  type="text"
                  value={ipConfig.gateway}
                  onChange={(e) => setIpConfig({ ...ipConfig, gateway: e.target.value })}
                  placeholder="192.168.1.1"
                  className="w-full bg-stone-900 border border-stone-700 rounded px-4 py-3 text-stone-100 placeholder-stone-600 focus:border-amber-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-300 mb-2">DNS Server</label>
                <input
                  type="text"
                  value={ipConfig.dns}
                  onChange={(e) => setIpConfig({ ...ipConfig, dns: e.target.value })}
                  placeholder="8.8.8.8"
                  className="w-full bg-stone-900 border border-stone-700 rounded px-4 py-3 text-stone-100 placeholder-stone-600 focus:border-amber-400 transition-colors"
                />
              </div>
              <button
                onClick={handleApplyIP}
                className="w-full bg-amber-500 hover:bg-amber-600 text-stone-900 font-medium py-3 rounded transition-colors mt-2"
              >
                Apply Configuration
              </button>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* Hostname Settings */}
      <FadeInSection delay={0.2}>
        <section className="mb-12">
          <h2 className="text-3xl font-serif font-light mb-6 text-amber-400">Hostname Settings</h2>
          <div className="bg-stone-800/50 rounded-lg p-8 border border-white/5">
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-stone-300 mb-2">Computer Name</label>
                <input
                  type="text"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  placeholder="DESKTOP-VM01"
                  className="w-full bg-stone-900 border border-stone-700 rounded px-4 py-3 text-stone-100 placeholder-stone-600 focus:border-amber-400 transition-colors"
                />
              </div>
              <button
                onClick={handleApplyHostname}
                className="w-full bg-amber-500 hover:bg-amber-600 text-stone-900 font-medium py-3 rounded transition-colors"
              >
                Apply Hostname
              </button>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* Port Proxy Rules */}
      <FadeInSection delay={0.3}>
        <section className="mb-12">
          <h2 className="text-3xl font-serif font-light mb-6 text-amber-400">Port Proxy Rules</h2>
          <div className="bg-stone-800/50 rounded-lg p-8 border border-white/5">
            <div className="space-y-4">
              {proxyRules.map((rule, index) => (
                <div key={index} className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={rule.listenPort}
                    onChange={(e) => {
                      const newRules = [...proxyRules]
                      newRules[index].listenPort = e.target.value
                      setProxyRules(newRules)
                    }}
                    placeholder="Listen Port"
                    className="bg-stone-900 border border-stone-700 rounded px-4 py-3 text-stone-100 placeholder-stone-600 focus:border-amber-400 transition-colors"
                  />
                  <input
                    type="text"
                    value={rule.connectAddress}
                    onChange={(e) => {
                      const newRules = [...proxyRules]
                      newRules[index].connectAddress = e.target.value
                      setProxyRules(newRules)
                    }}
                    placeholder="Connect Address"
                    className="bg-stone-900 border border-stone-700 rounded px-4 py-3 text-stone-100 placeholder-stone-600 focus:border-amber-400 transition-colors"
                  />
                  <input
                    type="text"
                    value={rule.connectPort}
                    onChange={(e) => {
                      const newRules = [...proxyRules]
                      newRules[index].connectPort = e.target.value
                      setProxyRules(newRules)
                    }}
                    placeholder="Connect Port"
                    className="bg-stone-900 border border-stone-700 rounded px-4 py-3 text-stone-100 placeholder-stone-600 focus:border-amber-400 transition-colors"
                  />
                </div>
              ))}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={addProxyRule}
                  className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-100 font-medium py-3 rounded transition-colors"
                >
                  Add Rule
                </button>
                <button className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-900 font-medium py-3 rounded transition-colors">
                  Apply Rules
                </button>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>
    </div>
  )
}
