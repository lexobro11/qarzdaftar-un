export interface DebtRecord {
  id: string
  ism: string
  tel: string
  qarz: number
  sana: string
  tolandi: boolean
}

export interface AuthState {
  isAuthenticated: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}
