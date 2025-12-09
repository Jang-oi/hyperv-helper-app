import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Copy, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from 'sonner' // toast 임포트 추가 (오류 메시지 표시용)

interface OTPAccount {
  id: string
  alias: string
  key: string // 렌더러에서는 키를 사용하지 않지만 타입은 유지
  code: string // 메인 프로세스에서 받아옴
}

export default function OTPPage() {
  // Mock 데이터를 제거하고 빈 배열로 초기화
  const [accounts, setAccounts] = useState<OTPAccount[]>([])

  // 남은 시간은 IPC를 통해 메인 프로세스와 동기화됩니다.
  const [timeLeft, setTimeLeft] = useState(30)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const [newAlias, setNewAlias] = useState("")
  const [newKey, setNewKey] = useState("")

  // ---------------------------------------------------
  // 데이터 로드 및 갱신 로직 (IPC 사용)
  // ---------------------------------------------------
  const loadAccountsAndSyncTime = async () => {
    try {
      // 1. IPC를 통해 계정 목록과 현재 코드를 불러옴
      const result = await window.api.otp.getAccounts();
      if (result.success && result.accounts) {
        setAccounts(result.accounts);
      } else {
        toast.error(result.error || 'OTP 계정 로드에 실패했습니다.');
        setAccounts([]); // 실패 시 목록 비우기
      }

      // 2. 남은 시간 정보를 IPC 핸들러에서 가져와 동기화
      const timeResult = await window.api.otp.getRefreshTime();
      if (timeResult.success && timeResult.timeLeft) {
        setTimeLeft(timeResult.timeLeft);
      }
    } catch (error) {
      console.error('Failed to load OTP accounts:', error);
      toast.error('IPC 통신 오류: OTP 데이터를 가져올 수 없습니다.');
    }
  };


  useEffect(() => {
    // 1. 최초 로드 및 시간 동기화
    loadAccountsAndSyncTime();

    // 2. 1초마다 남은 시간 갱신 타이머
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 30초 주기가 끝날 때 메인 프로세스에서 코드를 갱신
          loadAccountsAndSyncTime();
          return 30; // 타이머를 30으로 초기화
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const checkScroll = () => {
      const scrollElement = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollElement) {
        const hasScroll = scrollElement.scrollHeight > scrollElement.clientHeight
        setShowScrollIndicator(hasScroll)
      }
    }

    checkScroll()
    const timer = setTimeout(checkScroll, 100)
    return () => clearTimeout(timer)
  }, [accounts])

  // ---------------------------------------------------
  // 계정 추가 로직 (IPC 사용)
  // ---------------------------------------------------
  const handleAddAccount = async () => {
    if (newAlias && newKey) {
      // IPC 호출
      const result = await (window as any).api.otp.addAccount(newAlias, newKey);

      if (result.success && result.account) {
        // 성공 시 목록에 추가하고 상태 초기화
        setAccounts([...accounts, result.account]);
        setNewAlias("");
        setNewKey("");
        toast.success(`'${newAlias}' 계정이 추가되었습니다.`);
      } else {
        // 오류 처리 (예: 유효하지 않은 키)
        toast.error(result.error || '계정 추가에 실패했습니다.');
      }
    }
  }

  // ---------------------------------------------------
  // 계정 삭제 로직 (IPC 사용)
  // ---------------------------------------------------
  const handleDeleteAccount = async (id: string) => {
    // IPC 호출
    const result = await (window as any).api.otp.deleteAccount(id);

    if (result.success) {
      setAccounts(accounts.filter((account) => account.id !== id));
      toast.success('계정이 삭제되었습니다.');
    } else {
      toast.error(result.error || '계정 삭제에 실패했습니다.');
    }
  }

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const progress = (timeLeft / 30) * 100

  return (
    <div>
      {/* ... (return 문은 파일 내용과 동일하게 유지) ... */}
      {/* 주석 처리된 부분은 복사 후 파일의 내용으로 교체하세요. */}

      <h2 className="text-2xl font-bold text-foreground mb-5">OTP 관리</h2>

      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">다음 갱신</span>
          <span className="text-2xl font-bold text-primary">{timeLeft}초</span>
        </div>
        <Progress value={progress} className="h-2" />
      </Card>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-10 mb-4">
          <TabsTrigger value="accounts">내 계정 ({accounts.length})</TabsTrigger>
          <TabsTrigger value="add">새 계정 추가</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <div className="relative">
            <div ref={scrollAreaRef}>
              <ScrollArea className="h-[440px]">
                <div className="grid gap-3">
                  {accounts.map((account) => (
                    <Card key={account.id} className="p-3">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground truncate">{account.alias}</p>
                        <div className="flex items-center justify-between gap-2">
                          {/* OTP 코드가 6자리보다 길거나 짧을 수 있으므로 트래킹은 제거할 수 있습니다 */}
                          <p className="text-xl font-bold text-primary tracking-wider">{account.code}</p>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => copyToClipboard(account.code, account.id)}
                            >
                              {copiedId === account.id ? (
                                <Check className="w-4 h-4 text-primary" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDeleteAccount(account.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {/* 키를 표시하는 대신 (보안상 민감) 다른 정보를 표시하거나 제거할 수 있습니다. */}
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{account.key}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
            {showScrollIndicator && (
              <div className="absolute bottom-0 left-0 right-0 h-6 flex items-end justify-center pointer-events-none">
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded">
                  <ChevronDown className="w-4 h-4 animate-bounce" />
                  <span>아래로 스크롤하여 더보기</span>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="add">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">새 OTP 계정 추가</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">계정명</label>
                <Input
                  type="text"
                  placeholder="예: Google 계정 3"
                  className="h-9"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">OTP 키</label>
                <Input
                  type="text"
                  placeholder="예: JBSWY3DPEHPK3PXP"
                  className="h-9"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={handleAddAccount} className="w-full h-9" disabled={!newAlias || !newKey}>
                <Plus className="w-4 h-4 mr-2" />
                계정 추가
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
