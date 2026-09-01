import { useEffect } from "react";
import { useLocation, useNavigate } from "@/lib/router-compat";

export const POST_AUTH_KEY = "post_auth_redirect";

/**
 * OAuth providers must return to a plain same-origin URL, so Google sign-in
 * lands on "/". This picks up the intended destination and forwards there.
 */
const PostAuthRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let target: string | null = null;
    try {
      target = sessionStorage.getItem(POST_AUTH_KEY);
    } catch {
      target = null;
    }
    if (!target) return;
    try {
      sessionStorage.removeItem(POST_AUTH_KEY);
    } catch {
      /* ignore */
    }
    if (target !== location.pathname) navigate(target, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default PostAuthRedirect;
