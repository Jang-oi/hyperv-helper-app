import { ipcMain } from 'electron'
import { authenticator } from 'otplib'
import type { OTPAccount } from '../../shared/types'

// 💡 Electron Store 키 경로
const STORE_KEY_PREFIX = 'otp.accounts'

/**
 * OTP 코드 생성 및 데이터 관리를 위한 IPC 핸들러를 등록합니다.
 * @param store Electron Store 인스턴스
 */
export function registerOTPHandlers(store: any): void {
  // Store에서 계정 목록 (키 포함)을 로드합니다.
  // code 필드는 저장하지 않으므로 Omit<OTPAccount, 'code'> 타입을 사용합니다.
  const loadAccountsFromStore = (): Omit<OTPAccount, 'code'>[] => {
    return store.get(STORE_KEY_PREFIX, [])
  }

  // 계정 목록을 Store에 저장합니다.
  const saveAccountsToStore = (accounts: Omit<OTPAccount, 'code'>[]): void => {
    store.set(STORE_KEY_PREFIX, accounts)
  }

  // ---------------------------------------------------
  // IPC 핸들러 구현
  // ---------------------------------------------------

  // 모든 OTP 계정 조회 및 현재 코드 생성
  ipcMain.handle('otp:getAccounts', async (): Promise<{ success: boolean; accounts?: OTPAccount[]; error?: string }> => {
    try {
      const storedAccounts = loadAccountsFromStore()

      // 불러온 키를 기반으로 현재 코드(TOTP)를 생성하여 반환합니다.
      const accountsWithCodes: OTPAccount[] = storedAccounts.map((account) => ({
        ...account,
        code: authenticator.generate(account.key)
      }))

      return { success: true, accounts: accountsWithCodes }
    } catch (e: any) {
      console.error('Failed to get OTP accounts:', e)
      return { success: false, error: 'OTP 계정 조회 및 코드 생성에 실패했습니다.' }
    }
  })

  // OTP 계정 추가
  ipcMain.handle(
    'otp:addAccount',
    async (_event, alias: string, key: string): Promise<{ success: boolean; account?: OTPAccount; error?: string }> => {
      try {
        // 키 유효성 검사 (간단한 길이 체크)
        if (!alias || !key || key.length < 16) {
          return { success: false, error: '계정명과 유효한 OTP 키를 입력해주세요. 키는 최소 16자 이상이어야 합니다.' }
        }

        const existingAccounts = loadAccountsFromStore()

        const newAccountWithoutCode: Omit<OTPAccount, 'code'> = {
          id: Date.now().toString(),
          alias: alias,
          key: key
        }

        const allAccounts = [...existingAccounts, newAccountWithoutCode]
        saveAccountsToStore(allAccounts)

        // 클라이언트에 반환할 때는 현재 코드를 포함
        const newAccountWithCode: OTPAccount = {
          ...newAccountWithoutCode,
          code: authenticator.generate(key)
        }

        return { success: true, account: newAccountWithCode }
      } catch (e: any) {
        console.error('Failed to add OTP account:', e)
        return { success: false, error: `계정 추가 실패: ${e.message}` }
      }
    }
  )

  // OTP 계정 삭제
  ipcMain.handle('otp:deleteAccount', async (_event, id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const existingAccounts = loadAccountsFromStore()
      const filteredAccounts = existingAccounts.filter((account) => account.id !== id)

      saveAccountsToStore(filteredAccounts)

      return { success: true }
    } catch (e: any) {
      console.error('Failed to delete OTP account:', e)
      return { success: false, error: '계정 삭제 실패.' }
    }
  })

  // OTP 코드 갱신 시간 정보 제공 (클라이언트 동기화용)
  ipcMain.handle('otp:getRefreshTime', async (): Promise<{ success: boolean; timeLeft?: number }> => {
    // 💡 otplib의 timeUsed()를 사용하여 남은 시간을 계산
    const timeUsed = authenticator.timeUsed() // 경과 시간 (0 ~ 29)
    const secondsRemaining = 30 - timeUsed // 남은 시간 (30 - 경과 시간)

    return { success: true, timeLeft: secondsRemaining }
  })
}
