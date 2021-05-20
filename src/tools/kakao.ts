import { KakaoOAuth } from '@openauth/kakao';

export const kakao = new KakaoOAuth({
  clientId: String(process.env.KAKAO_CLIENT_ID),
  clientSecret: String(process.env.KAKAO_CLIENT_SECRET),
  redirectUri: String(process.env.KAKAO_REDIRECT_URI),
});
