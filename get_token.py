"""[일회성] YouTube OAuth 2.0 refresh token 발급 스크립트.

로컬 최초 1회 실행으로 crawler/token.pickle 생성.
GitHub Actions는 GOOGLE_REFRESH_TOKEN 환경변수로 인증하므로 이 스크립트 불필요.

Usage:
    python get_token.py
"""
from google_auth_oauthlib.flow import InstalledAppFlow
import pickle

flow = InstalledAppFlow.from_client_secrets_file(
    'crawler/client_secret.json',
    ['https://www.googleapis.com/auth/youtube']
)
creds = flow.run_local_server(port=0, prompt='consent')
with open('crawler/token.pickle', 'wb') as f:
    pickle.dump(creds, f)
