import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const SHARED_NUMBER = '+1 (800) 555-0100'
const CREATOR_EXT = '4829'
const PROFILE_URL = 'callmenow.app/creator_name'

const revenueData = [
  { day: 'Mon', amount: 120 },
  { day: 'Tue', amount: 150 },
  { day: 'Wed', amount: 80 },
  { day: 'Thu', amount: 200 },
  { day: 'Fri', amount: 340 },
  { day: 'Sat', amount: 450 },
  { day: 'Sun', amount: 300 },
]

const callBreakdown = [
  { name: 'Answered', value: 65 },
  { name: 'Declined', value: 20 },
  { name: 'Missed', value: 15 },
]

const callHistory = [
  { number: '+1 555 882 1190', status: 'Answered', duration: '8 mins', amount: '+$32.00', positive: true },
  { number: '+1 555 441 0098', status: 'Missed', duration: null, amount: '$0.00', positive: false },
  { number: '+1 555 778 2200', status: 'Answered', duration: '15 mins', amount: '+$60.00', positive: true },
]

const payoutHistory = [
  { label: 'NowPayments · USDT', date: 'Oct 1, 2025 · Confirmed', amount: '$1,240.00', coin: '₮' },
  { label: 'NowPayments · USDT', date: 'Sep 1, 2025 · Confirmed', amount: '$980.00', coin: '₮' },
]

const activity = [
  { icon: '💰', title: 'Payment Received', desc: 'Fan_9948 paid $20.00 for 5 mins.', time: '2m ago', color: 'gold' },
  { icon: '🎥', title: 'Video Switch Request', desc: 'WebRTC link sent via SMS to fan.', time: '10m ago', color: 'blue' },
  { icon: '📵', title: 'Missed Call', desc: '+1 555 998 1234 tried ext. 4829.', time: '1h ago', color: 'red' },
]

const COINS = ['USDT', 'BTC', 'ETH', 'LTC', 'USDC'] as const
type Coin = typeof COINS[number]

function useTheme(dark: boolean) {
  return dark
    ? {
        bg: 'bg-[#080808]',
        card: 'bg-[#101010]',
        cardHover: 'hover:bg-[#141414]',
        cardAlt: 'bg-[#0D0D0D]',
        border: 'border-[#1E1E1E]',
        borderHex: '#1E1E1E',
        text: 'text-[#F0EBE0]',
        muted: 'text-[#555555]',
        mutedMd: 'text-[#888888]',
        input: 'bg-[#181818] border-[#2A2A2A] text-[#F0EBE0] placeholder-[#3A3A3A]',
        toggleOff: 'bg-[#1E1E1E]',
        headerBg: 'bg-[#080808]/95 backdrop-blur-md border-[#1E1E1E]',
        navBg: 'bg-[#0A0A0A]/97 backdrop-blur-md border-[#1E1E1E]',
        tooltipBg: '#161616',
        tooltipBorder: '#2A2A2A',
        tooltipText: '#F0EBE0',
        pieDecline: '#242424',
        pieBorder: '#3A3A3A',
        badgeBg: 'bg-[#1A1A1A]',
        tag: 'bg-[#1A1A1A] text-[#555555]',
        accordion: 'bg-[#0C0C0C]',
        mutedHex: '#555555',
      }
    : {
        bg: 'bg-[#F4F1EB]',
        card: 'bg-white',
        cardHover: 'hover:bg-[#FAFAF8]',
        cardAlt: 'bg-[#F2EEE6]',
        border: 'border-[#E6E1D8]',
        borderHex: '#E6E1D8',
        text: 'text-[#0D0D0D]',
        muted: 'text-[#AAAAAA]',
        mutedMd: 'text-[#888888]',
        input: 'bg-[#EDE9E1] border-[#DDD8CE] text-[#111111] placeholder-[#BBBBBB]',
        toggleOff: 'bg-[#D8D3CA]',
        headerBg: 'bg-[#F4F1EB]/95 backdrop-blur-md border-[#E6E1D8]',
        navBg: 'bg-[#EEEAE2]/97 backdrop-blur-md border-[#DDD8CE]',
        tooltipBg: '#FFFFFF',
        tooltipBorder: '#E6E1D8',
        tooltipText: '#0D0D0D',
        pieDecline: '#DDD8CE',
        pieBorder: '#C8C3BA',
        badgeBg: 'bg-[#F0EDE6]',
        tag: 'bg-[#EDE9E1] text-[#999999]',
        accordion: 'bg-[#F8F5EF]',
        mutedHex: '#AAAAAA',
      }
}

function Toggle({ on, onToggle, t }: { on: boolean; onToggle: () => void; t: ReturnType<typeof useTheme> }) {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-5 rounded-full relative transition-colors duration-200 flex-shrink-0 ${on ? 'bg-[#C9A227]' : t.toggleOff}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function App() {
  const [dark, setDark] = useState(true)
  const [activeNav, setActiveNav] = useState<'overview' | 'profile'>('overview')
  const [available, setAvailable] = useState(false)
  const [copiedNum, setCopiedNum] = useState(false)
  const [copiedExt, setCopiedExt] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [rate, setRate] = useState(4)
  const [historyTab, setHistoryTab] = useState<'calls' | 'payouts'>('calls')

  // Profile editing
  const [editingName, setEditingName] = useState(false)
  const [displayName, setDisplayName] = useState('Creator Name')
  const [nameInput, setNameInput] = useState('Creator Name')

  // NowPayments
  const [selectedCoin, setSelectedCoin] = useState<Coin>('USDT')
  const [walletAddress, setWalletAddress] = useState('')
  const [walletSaved, setWalletSaved] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const PENDING_BALANCE = 342.50

  // Accordion sections
  const [openSection, setOpenSection] = useState<string | null>(null)
  const toggleSection = (key: string) => setOpenSection(s => s === key ? null : key)

  // Notification toggles
  const [notifs, setNotifs] = useState({ newCalls: true, missedCalls: true, payments: true, promos: false })

  // Privacy toggles
  const [privacy, setPrivacy] = useState({ hideCaller: false, twoFactor: true })

  // Logout confirm
  const [logoutConfirm, setLogoutConfirm] = useState(false)

  const t = useTheme(dark)

  function copyText(text: string, which: 'num' | 'ext' | 'link') {
    navigator.clipboard.writeText(text)
    if (which === 'num') { setCopiedNum(true); setTimeout(() => setCopiedNum(false), 2000) }
    else if (which === 'ext') { setCopiedExt(true); setTimeout(() => setCopiedExt(false), 2000) }
    else { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000) }
  }

  function saveWallet() {
    if (!walletAddress.trim()) return
    setWalletSaved(true)
    setTimeout(() => setWalletSaved(false), 2500)
  }

  function withdraw() {
    if (!walletAddress.trim()) { setOpenSection('payout'); return }
    setWithdrawing(true)
    setTimeout(() => setWithdrawing(false), 2000)
  }

  return (
    <div className={`${t.bg} ${t.text} min-h-screen transition-colors duration-300`} style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="max-w-md mx-auto relative">

        {/* ── HEADER ── */}
        <header className={`sticky top-0 z-40 border-b ${t.headerBg} ${t.border} transition-colors duration-300`}>
          <div className="flex justify-between items-center px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#C9A227] flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2C2 1.45 2.45 1 3 1h2.5c.45 0 .84.3.96.73l.7 2.5a1 1 0 0 1-.29 1L5.7 6.38a8 8 0 0 0 1.93 1.93l1.15-1.17a1 1 0 0 1 1-.29l2.5.7c.43.12.72.51.72.96V11c0 .55-.45 1-1 1C5.49 12 2 8.51 2 4V2Z" fill="black"/>
                </svg>
              </div>
              <span className="text-lg font-bold" style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.02em' }}>
                CallMeNow
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${t.border} ${t.badgeBg} ${available ? 'border-[#C9A227]/40' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${available ? 'bg-[#C9A227]' : 'bg-[#333]'}`} />
                <span className={available ? 'text-[#C9A227]' : t.muted}>{available ? 'Live' : 'Offline'}</span>
              </div>
              <button onClick={() => setDark(d => !d)}
                className={`w-8 h-8 rounded-full border ${t.border} ${t.card} flex items-center justify-center hover:border-[#C9A227]/50 transition-all text-sm`}>
                {dark ? '☀︎' : '☽'}
              </button>
            </div>
          </div>
          <div className={`px-5 pb-3 border-t ${t.border} flex items-center justify-between`}>
            <div className="mt-2.5">
              <p className={`text-[10px] uppercase tracking-[0.16em] ${t.muted} mb-0.5`}>Welcome back</p>
              <p className="text-sm font-medium">{displayName}</p>
            </div>
            <div className={`mt-2.5 text-right`}>
              <p className={`text-[10px] uppercase tracking-[0.16em] ${t.muted} mb-0.5`}>Ext.</p>
              <p className={`text-sm font-bold text-[#C9A227] tracking-widest`}>{CREATOR_EXT}</p>
            </div>
          </div>
        </header>

        <main className="px-4 py-4 pb-28 space-y-3.5">

          {/* ── OVERVIEW ── */}
          {activeNav === 'overview' && (
            <>
              {/* Availability + Routing */}
              <div className={`rounded-2xl border ${t.card} ${t.border} overflow-hidden`}>
                <div className="px-5 pt-5 pb-4 flex justify-between items-center">
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.16em] ${t.muted} mb-1`}>Availability</p>
                    <p className={`text-sm font-semibold ${available ? 'text-[#C9A227]' : t.muted}`}>
                      {available ? 'Accepting calls' : 'Not available'}
                    </p>
                  </div>
                  <Toggle on={available} onToggle={() => setAvailable(a => !a)} t={t} />
                </div>

                <div className={`px-5 pt-4 pb-3 border-t ${t.border}`}>
                  <p className={`text-[10px] uppercase tracking-[0.14em] ${t.muted} mb-2`}>Shared Line (Twilio)</p>
                  <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${t.border} ${t.cardAlt}`}>
                    <div>
                      <p className="font-semibold text-sm tracking-wider">{SHARED_NUMBER}</p>
                      <p className={`text-[10px] ${t.muted} mt-0.5`}>Fans call this number</p>
                    </div>
                    <button onClick={() => copyText(SHARED_NUMBER, 'num')}
                      className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-[#C9A227] text-black hover:bg-[#E2BC4A] transition-colors flex-shrink-0">
                      {copiedNum ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <p className={`text-[10px] uppercase tracking-[0.14em] ${t.muted} mb-2`}>Your Extension Code</p>
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                    style={{ backgroundColor: 'rgba(201,162,39,0.09)', border: '1px solid rgba(201,162,39,0.18)' }}>
                    <div>
                      <p className="font-bold text-[#C9A227] text-xl tracking-[0.3em]">{CREATOR_EXT}</p>
                      <p className={`text-[10px] ${t.muted} mt-0.5`}>IVR prompts fans to enter this</p>
                    </div>
                    <button onClick={() => copyText(CREATOR_EXT, 'ext')}
                      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors flex-shrink-0 ${t.border} ${t.tag}`}>
                      {copiedExt ? '✓ Copied' : 'Copy ext.'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Share Your Link */}
              <div className={`rounded-2xl border ${t.card} ${t.border} px-5 py-4`}>
                <p className={`text-[10px] uppercase tracking-[0.16em] ${t.muted} mb-3`}>Share Your Link</p>
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${t.border} ${t.cardAlt}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 text-[#C9A227]">
                      <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 1.5a6.5 6.5 0 110 13 6.5 6.5 0 010-13z" fill="currentColor" opacity=".3"/>
                      <path d="M6.5 10c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    <span className={`text-xs font-medium truncate ${t.mutedMd}`}>{PROFILE_URL}</span>
                  </div>
                  <button onClick={() => copyText(PROFILE_URL, 'link')}
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-[#C9A227] text-black hover:bg-[#E2BC4A] transition-colors flex-shrink-0 ml-2">
                    {copiedLink ? '✓ Copied' : 'Share'}
                  </button>
                </div>
                <p className={`text-[10px] ${t.muted} mt-2`}>Paste in your Linktree, OnlyFans bio, or Twitter/X.</p>
              </div>

              {/* Pending Balance + Withdraw */}
              <div className={`rounded-2xl border overflow-hidden`} style={{ borderColor: 'rgba(201,162,39,0.25)', backgroundColor: dark ? 'rgba(201,162,39,0.05)' : 'rgba(201,162,39,0.06)' }}>
                <div className="px-5 pt-5 pb-4 flex justify-between items-start">
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.16em] mb-1`} style={{ color: 'rgba(201,162,39,0.6)' }}>Available to Withdraw</p>
                    <p className="text-3xl font-bold text-[#C9A227]">${PENDING_BALANCE.toFixed(2)}</p>
                    <p className={`text-[11px] mt-1 ${t.muted}`}>via NowPayments · {selectedCoin}</p>
                  </div>
                  <button onClick={withdraw}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      withdrawing
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-[#C9A227] text-black hover:bg-[#E2BC4A]'
                    }`}>
                    {withdrawing ? '✓ Sent' : 'Withdraw'}
                  </button>
                </div>
                {!walletAddress && (
                  <div className={`px-5 pb-4`}>
                    <p className="text-[10px] text-amber-400/80">⚠ Add a wallet address in Profile → Payouts before withdrawing.</p>
                  </div>
                )}
              </div>

              {/* Quick Stats — 3 up */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Today', value: '$340', sub: '↑ 12%', subColor: 'text-emerald-500' },
                  { label: 'This Week', value: '$1,640', sub: '42 calls', subColor: t.muted },
                  { label: 'This Month', value: '$6,280', sub: '↑ 8%', subColor: 'text-emerald-500' },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl border ${t.card} ${t.border} p-3.5`}>
                    <p className={`text-[9px] uppercase tracking-[0.14em] ${t.muted} mb-2`}>{s.label}</p>
                    <p className="text-lg font-bold tracking-tight leading-none">{s.value}</p>
                    <p className={`text-[10px] mt-1.5 ${s.subColor}`}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Revenue Chart */}
              <div className={`rounded-2xl border ${t.card} ${t.border} p-5`}>
                <div className="flex justify-between items-center mb-5">
                  <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1rem', fontWeight: 600 }}>Revenue Analytics</h2>
                  <select className={`text-[11px] border rounded-lg px-2 py-1.5 focus:outline-none ${t.input}`}>
                    <option>This Week</option>
                    <option>This Month</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={165}>
                  <BarChart data={revenueData} barSize={16}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: t.mutedHex, fontSize: 10, fontFamily: 'Outfit' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: t.mutedHex, fontSize: 10, fontFamily: 'Outfit' }} tickFormatter={v => `$${v}`} width={36} />
                    <Tooltip cursor={{ fill: 'rgba(201,162,39,0.04)' }}
                      contentStyle={{ backgroundColor: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 10, fontSize: 12, fontFamily: 'Outfit', color: t.tooltipText }}
                      formatter={(v: number) => [`$${v}`, 'Earnings']} />
                    <Bar dataKey="amount" fill="#C9A227" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Call Breakdown */}
              <div className={`rounded-2xl border ${t.card} ${t.border} p-5`}>
                <h2 className="mb-4" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1rem', fontWeight: 600 }}>Call Breakdown</h2>
                <div className="flex items-center gap-5">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <PieChart width={112} height={112}>
                      <Pie data={callBreakdown} cx={52} cy={52} innerRadius={36} outerRadius={52} dataKey="value" strokeWidth={0}>
                        <Cell fill="#C9A227" />
                        <Cell fill={t.pieDecline} stroke={t.pieBorder} strokeWidth={1} />
                        <Cell fill="#EF4444" />
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold">65%</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {[
                      { color: '#C9A227', label: 'Answered', val: '65%' },
                      { color: t.pieDecline, label: 'Declined', val: '20%', outlined: true },
                      { color: '#EF4444', label: 'Missed', val: '15%' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color, outline: item.outlined ? `1px solid ${t.pieBorder}` : 'none' }} />
                        <span className={`flex-1 text-xs ${t.muted}`}>{item.label}</span>
                        <span className="font-semibold text-xs">{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className={`rounded-2xl border ${t.card} ${t.border} p-5`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1rem', fontWeight: 600 }}>Recent Activity</h2>
                  <span className="text-[#C9A227] text-xs font-semibold cursor-pointer hover:text-[#E2BC4A]">View All</span>
                </div>
                <div className="space-y-3.5">
                  {activity.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: a.color === 'gold' ? 'rgba(201,162,39,0.1)' : a.color === 'blue' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)' }}>
                        {a.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-tight">{a.title}</p>
                        <p className={`text-[11px] ${t.muted} mt-0.5`}>{a.desc}</p>
                      </div>
                      <span className={`text-[11px] ${t.muted} flex-shrink-0`}>{a.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* History */}
              <div className={`rounded-2xl border ${t.card} ${t.border} p-5`}>
                <h2 className="mb-4" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1rem', fontWeight: 600 }}>History</h2>
                <div className={`flex border-b ${t.border} mb-4`}>
                  {(['calls', 'payouts'] as const).map(tab => (
                    <button key={tab} onClick={() => setHistoryTab(tab)}
                      className={`pb-2.5 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] border-b-2 -mb-px transition-colors ${historyTab === tab ? 'text-[#C9A227] border-[#C9A227]' : `${t.muted} border-transparent`}`}>
                      {tab === 'calls' ? 'Calls' : 'Payouts'}
                    </button>
                  ))}
                </div>
                {historyTab === 'calls' && (
                  <div className="space-y-3">
                    {callHistory.map((c, i) => (
                      <div key={i} className={`flex justify-between items-center pb-3 ${i < callHistory.length - 1 ? `border-b ${t.border}` : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm ${c.positive ? 'text-emerald-500' : 'text-red-500'}`}>{c.positive ? '📞' : '📵'}</span>
                          <div>
                            <p className="font-medium text-xs">{c.number}</p>
                            <p className={`text-[11px] ${t.muted}`}>{c.status}{c.duration ? ` · ${c.duration}` : ''}</p>
                          </div>
                        </div>
                        <p className={`font-semibold text-xs ${c.positive ? 'text-[#C9A227]' : t.muted}`}>{c.amount}</p>
                      </div>
                    ))}
                  </div>
                )}
                {historyTab === 'payouts' && (
                  <div className="space-y-3">
                    {payoutHistory.map((w, i) => (
                      <div key={i} className={`flex justify-between items-center pb-3 ${i < payoutHistory.length - 1 ? `border-b ${t.border}` : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-[#C9A227] text-sm">₮</span>
                          <div>
                            <p className="font-medium text-xs">{w.label}</p>
                            <p className={`text-[11px] ${t.muted}`}>{w.date}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-xs text-[#C9A227]">{w.amount}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── PROFILE ── */}
          {activeNav === 'profile' && (
            <>
              {/* Profile card */}
              <div className={`rounded-2xl border ${t.card} ${t.border} p-6 flex flex-col items-center text-center`}>
                <div className="w-20 h-20 rounded-full bg-[#C9A227] flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-black" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    {displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {editingName ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      className={`text-center text-lg font-semibold rounded-lg px-3 py-1 border focus:outline-none focus:border-[#C9A227] transition-colors ${t.input}`}
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                      autoFocus
                    />
                    <button onClick={() => { setDisplayName(nameInput); setEditingName(false) }}
                      className="text-xs font-bold text-[#C9A227]">Save</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mb-1">
                    <h2 className="text-xl font-semibold" style={{ fontFamily: "'Instrument Serif', serif" }}>{displayName}</h2>
                    <button onClick={() => setEditingName(true)} className={`text-xs ${t.muted} hover:text-[#C9A227] transition-colors`}>✎</button>
                  </div>
                )}

                <p className={`text-xs ${t.muted} mb-1`}>@{displayName.toLowerCase().replace(/\s+/g, '_')}</p>
                <div className={`text-[11px] px-2.5 py-1 rounded-full ${t.tag} mb-5`}>Ext. {CREATOR_EXT}</div>
                <div className={`flex gap-10 pt-4 border-t ${t.border} w-full justify-center`}>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#C9A227]">${rate.toFixed(2)}</p>
                    <p className={`text-[11px] ${t.muted} mt-0.5`}>Per Minute</p>
                  </div>
                  <div className={`w-px ${dark ? 'bg-[#1E1E1E]' : 'bg-[#E6E1D8]'}`} />
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#C9A227]">$8,450</p>
                    <p className={`text-[11px] ${t.muted} mt-0.5`}>Total Earned</p>
                  </div>
                </div>
              </div>

              {/* Rate Settings */}
              <div className={`rounded-2xl border ${t.card} ${t.border} p-5`}>
                <h3 className={`text-[10px] uppercase tracking-[0.16em] ${t.muted} mb-4`}>Rate Settings</h3>
                <div className={`flex justify-between items-center pb-4 mb-4 border-b ${t.border}`}>
                  <div>
                    <p className="text-sm font-medium">Per Minute Rate</p>
                    <p className={`text-[10px] ${t.muted} mt-0.5`}>Min $1.00 · Max $20.00</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setRate(r => Math.max(1, r - 1))}
                      className={`w-8 h-8 rounded-lg border ${t.border} flex items-center justify-center hover:border-[#C9A227]/50 transition-colors ${t.muted}`}>−</button>
                    <span className="font-bold text-[#C9A227] w-14 text-center text-sm">${rate.toFixed(2)}</span>
                    <button onClick={() => setRate(r => Math.min(20, r + 1))}
                      className={`w-8 h-8 rounded-lg border ${t.border} flex items-center justify-center hover:border-[#C9A227]/50 transition-colors ${t.muted}`}>+</button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Minimum Deposit</p>
                    <p className={`text-[10px] ${t.muted} mt-0.5`}>Required before fan connects</p>
                  </div>
                  <span className="font-bold text-[#C9A227] text-sm">$10.00</span>
                </div>
              </div>

              {/* Settings accordion group */}
              <div className={`rounded-2xl border ${t.card} ${t.border} overflow-hidden`}>

                {/* Section header */}
                <div className={`px-4 py-2.5 border-b ${t.border} ${t.accordion}`}>
                  <p className={`text-[10px] uppercase tracking-[0.16em] ${t.muted}`}>Account</p>
                </div>

                {/* KYC */}
                <div className={`flex justify-between items-center px-4 py-3.5 border-b ${t.border}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">✅</span>
                    <div>
                      <p className="font-medium text-sm">KYC / Age Verification</p>
                      <p className={`text-[10px] ${t.muted} mt-0.5`}>Onfido · SumSub</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">VERIFIED</span>
                </div>

                {/* NowPayments — accordion */}
                <div className={`border-b ${t.border}`}>
                  <button onClick={() => toggleSection('payout')}
                    className={`w-full flex justify-between items-center px-4 py-3.5 ${t.cardHover} transition-colors`}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">🪙</span>
                      <div className="text-left">
                        <p className="font-medium text-sm">NowPayments · Crypto Payout</p>
                        <p className={`text-[10px] ${t.muted} mt-0.5`}>{walletAddress ? `${selectedCoin} · ${walletAddress.slice(0, 8)}…` : 'No wallet added yet'}</p>
                      </div>
                    </div>
                    <span className={`text-xs transition-transform duration-200 ${openSection === 'payout' ? 'rotate-90' : ''} ${t.muted}`}>›</span>
                  </button>
                  {openSection === 'payout' && (
                    <div className={`px-4 pb-4 pt-1 border-t ${t.border} ${t.accordion}`}>
                      <p className={`text-[10px] uppercase tracking-[0.14em] ${t.muted} mb-3`}>Select coin</p>
                      <div className="flex gap-1.5 flex-wrap mb-4">
                        {COINS.map(coin => (
                          <button key={coin} onClick={() => setSelectedCoin(coin)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                              selectedCoin === coin
                                ? 'bg-[#C9A227] text-black border-[#C9A227]'
                                : `${t.border} ${t.muted} ${t.cardHover}`
                            }`}>
                            {coin}
                          </button>
                        ))}
                      </div>
                      <p className={`text-[10px] uppercase tracking-[0.14em] ${t.muted} mb-2`}>{selectedCoin} Wallet Address</p>
                      <div className="flex gap-2">
                        <input
                          value={walletAddress}
                          onChange={e => setWalletAddress(e.target.value)}
                          placeholder={`Paste your ${selectedCoin} address`}
                          className={`flex-1 text-xs px-3 py-2.5 rounded-xl border focus:outline-none focus:border-[#C9A227]/60 transition-colors ${t.input}`}
                        />
                        <button onClick={saveWallet}
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex-shrink-0 transition-colors ${
                            walletSaved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#C9A227] text-black hover:bg-[#E2BC4A]'
                          }`}>
                          {walletSaved ? '✓' : 'Save'}
                        </button>
                      </div>
                      {walletAddress && (
                        <p className={`text-[10px] ${t.muted} mt-2`}>Withdrawals sent automatically at month-end.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Notifications — accordion */}
                <div className={`border-b ${t.border}`}>
                  <button onClick={() => toggleSection('notifs')}
                    className={`w-full flex justify-between items-center px-4 py-3.5 ${t.cardHover} transition-colors`}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">🔔</span>
                      <p className="font-medium text-sm">Notifications</p>
                    </div>
                    <span className={`text-xs transition-transform duration-200 ${openSection === 'notifs' ? 'rotate-90' : ''} ${t.muted}`}>›</span>
                  </button>
                  {openSection === 'notifs' && (
                    <div className={`px-4 pb-4 pt-1 border-t ${t.border} ${t.accordion} space-y-3`}>
                      {([
                        { key: 'newCalls', label: 'Incoming calls', sub: 'Ring when a fan connects' },
                        { key: 'missedCalls', label: 'Missed calls', sub: 'Alert when you miss a call' },
                        { key: 'payments', label: 'Payments', sub: 'Notify on every payment received' },
                        { key: 'promos', label: 'Platform updates', sub: 'News and promotions from CallMeNow' },
                      ] as { key: keyof typeof notifs; label: string; sub: string }[]).map((item, i, arr) => (
                        <div key={item.key} className={`flex items-center justify-between pt-3 ${i > 0 ? `border-t ${t.border}` : ''}`}>
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className={`text-[10px] ${t.muted} mt-0.5`}>{item.sub}</p>
                          </div>
                          <Toggle on={notifs[item.key]} onToggle={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key] }))} t={t} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Privacy & Security — accordion */}
                <div className={`border-b ${t.border}`}>
                  <button onClick={() => toggleSection('privacy')}
                    className={`w-full flex justify-between items-center px-4 py-3.5 ${t.cardHover} transition-colors`}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">🔒</span>
                      <p className="font-medium text-sm">Privacy & Security</p>
                    </div>
                    <span className={`text-xs transition-transform duration-200 ${openSection === 'privacy' ? 'rotate-90' : ''} ${t.muted}`}>›</span>
                  </button>
                  {openSection === 'privacy' && (
                    <div className={`px-4 pb-4 pt-1 border-t ${t.border} ${t.accordion} space-y-3`}>
                      {([
                        { key: 'hideCaller', label: 'Hide caller IDs', sub: 'Mask fan numbers in your history' },
                        { key: 'twoFactor', label: 'Two-factor auth', sub: 'SMS code required at login' },
                      ] as { key: keyof typeof privacy; label: string; sub: string }[]).map((item, i) => (
                        <div key={item.key} className={`flex items-center justify-between pt-3 ${i > 0 ? `border-t ${t.border}` : ''}`}>
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className={`text-[10px] ${t.muted} mt-0.5`}>{item.sub}</p>
                          </div>
                          <Toggle on={privacy[item.key]} onToggle={() => setPrivacy(p => ({ ...p, [item.key]: !p[item.key] }))} t={t} />
                        </div>
                      ))}
                      <div className={`pt-3 border-t ${t.border}`}>
                        <button className={`text-xs font-semibold text-[#C9A227] hover:text-[#E2BC4A] transition-colors`}>
                          Change PIN / Password →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Log Out */}
                <div>
                  {!logoutConfirm ? (
                    <button onClick={() => setLogoutConfirm(true)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 ${t.cardHover} transition-colors`}>
                      <span className="text-sm">🚪</span>
                      <p className="font-medium text-sm text-red-500">Log Out</p>
                    </button>
                  ) : (
                    <div className={`px-4 py-3.5 ${t.accordion}`}>
                      <p className="text-sm font-medium mb-3">Are you sure you want to log out?</p>
                      <div className="flex gap-2">
                        <button onClick={() => setLogoutConfirm(false)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${t.border} ${t.muted} ${t.cardHover} transition-colors`}>
                          Cancel
                        </button>
                        <button className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-500/90 text-white hover:bg-red-500 transition-colors">
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </main>

        {/* Bottom Nav */}
        <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto flex justify-around py-3.5 z-50 border-t ${t.navBg} ${t.border} transition-colors duration-300`}>
          {([
            { id: 'overview' as const, label: 'Overview', svg: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg> },
            { id: 'profile' as const, label: 'Profile', svg: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 17c0-3.31 3.13-6 7-6s7 2.69 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          ]).map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${activeNav === item.id ? 'text-[#C9A227]' : t.muted}`}>
              {item.svg}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
