import Logo from '@/components/Logo';
import { SYSTEM_NAME } from '@/constants/app';
import { DEFAULT_ROUTE_PATH, getAffixPaths, matchRoute } from '@/router';
import { login } from '@/services/auth';
import { RouteLoadCancelledError, useRouteStore } from '@/stores/routes';
import { useTabsStore } from '@/stores/tabs';
import { clearAuth, getSafeRedirect, getToken, setAuth } from '@/utils/auth';
import { getRequestErrorMessage } from '@/utils/request-error';
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Navigate, useModel, useSearchParams } from '@umijs/max';
import { App, Button, Form, Input } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';

interface LoginFormValues {
  username: string;
  password: string;
}

function clamp(value: number) {
  return Math.max(-1, Math.min(1, value));
}

const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const { setInitialState } = useModel('@@initialState');
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // 鼠标跟随 / 眼睛追踪
  const mascotRef = useRef<HTMLDivElement>(null);
  const mascotBodyRef = useRef<HTMLDivElement>(null);
  const robotHeadRef = useRef<SVGGElement>(null);
  const pupilLeftRef = useRef<SVGGElement>(null);
  const pupilRightRef = useRef<SVGGElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);
  const decor2Ref = useRef<HTMLDivElement>(null);

  const eyesClosedRef = useRef(false);
  const isEyesClosed = isPasswordFocused && !passwordVisible;

  useEffect(() => {
    eyesClosedRef.current = isEyesClosed;
  }, [isEyesClosed]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const tick = () => {
      const rect = mascotRef.current?.getBoundingClientRect();
      if (rect?.width) {
        const targetX = clamp(
          (mouseX - (rect.left + rect.width / 2)) / (window.innerWidth / 2),
        );
        const targetY = clamp(
          (mouseY - (rect.top + rect.height / 2)) / (window.innerHeight / 2),
        );

        // 弹簧式插值，略带惰性
        currentX += (targetX - currentX) * 0.07;
        currentY += (targetY - currentY) * 0.07;

        if (!eyesClosedRef.current) {
          const pupilX = currentX * 5;
          const pupilY = currentY * 5;
          pupilLeftRef.current?.style.setProperty(
            'transform',
            `translate(${pupilX}px, ${pupilY}px)`,
          );
          pupilRightRef.current?.style.setProperty(
            'transform',
            `translate(${pupilX}px, ${pupilY}px)`,
          );
        }

        robotHeadRef.current?.style.setProperty(
          'transform',
          `rotate(${currentX * 3}deg)`,
        );
        mascotBodyRef.current?.style.setProperty(
          'transform',
          `translate(${currentX * 8}px, ${currentY * 6}px)`,
        );
        decorRef.current?.style.setProperty(
          'transform',
          `translate(${currentX * 12}px, ${currentY * 8}px)`,
        );
        decor2Ref.current?.style.setProperty(
          'transform',
          `translate(${currentX * -6}px, ${currentY * -4}px)`,
        );
      }

      frame = window.requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMouseMove);
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const redirectParam = searchParams.get('redirect');
  const redirect = getSafeRedirect(redirectParam);
  const currentRoutes = useRouteStore.getState().routes;
  const currentMatch = redirect
    ? matchRoute(redirect, currentRoutes)
    : undefined;

  if (getToken() && !loading) {
    return (
      <Navigate to={currentMatch ? redirect! : DEFAULT_ROUTE_PATH} replace />
    );
  }

  const handleFinish = async (values: LoginFormValues) => {
    if (loading) return;
    const requestSession = getToken();
    let loginToken: string | undefined;
    setLoading(true);
    try {
      const { token, expiresIn, user, roles, permissions } = await login(
        values,
      );
      if (getToken() !== requestSession) return;
      const roleList = roles ?? user?.roles ?? [];
      const permissionSet = permissions ??
        user?.permissions ?? { menus: [], buttons: [] };
      // 角色、菜单权限、按钮权限一并写入登录态，刷新后由 initialState 恢复
      setAuth(token, expiresIn, {
        ...user,
        roles: roleList,
        permissions: permissionSet,
      });
      loginToken = token;
      useTabsStore.getState().reset();
      useRouteStore.getState().reset();
      const routes = await useRouteStore.getState().loadRoutes();
      if (getToken() !== token) return;
      await setInitialState((previous) =>
        getToken() === token
          ? {
              name: user?.nickName || user?.name || '',
              avatar: user?.avatar,
              roles: roleList,
              menuPermissions: permissionSet.menus,
              buttonPermissions: permissionSet.buttons,
            }
          : previous,
      );
      if (getToken() !== token) return;

      // 回跳地址必须是当前账号有权限访问的路由，否则进入第一个可访问页面
      const fallbackPath = getAffixPaths(routes)[0] ?? DEFAULT_ROUTE_PATH;
      const targetMatch = redirect ? matchRoute(redirect, routes) : undefined;
      const target = targetMatch ? redirect! : fallbackPath;
      message.success('登录成功');

      // 接口路由在 Umi 渲染前注入，登录后整页刷新才能拿到新账号的菜单
      window.location.replace(target);
    } catch (error) {
      if (
        error instanceof RouteLoadCancelledError ||
        getToken() !== (loginToken ?? requestSession)
      )
        return;
      clearAuth();
      useRouteStore.getState().reset();
      message.error(getRequestErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.dynamicBg} aria-hidden>
        <div className={styles.skyElements}>
          <div className={`${styles.skyShape} ${styles.s1}`} />
          <div className={`${styles.skyShape} ${styles.s2}`} />
          <div className={`${styles.skyShape} ${styles.s3}`} />
          <div className={`${styles.skyShape} ${styles.s4}`} />
          <div className={`${styles.skyShape} ${styles.s5}`} />
        </div>
      </div>

      <div className={styles.loginCard}>
        <div className={styles.cardLeft}>
          <div className={styles.brand}>
            <div className={styles.logoBox}>
              <Logo size={30} />
            </div>
            <span className={styles.brandName}>{SYSTEM_NAME}</span>
          </div>

          <div ref={mascotRef} className={styles.mascotArea}>
            <div className={`${styles.floatingParticle} ${styles.p1}`} />
            <div className={`${styles.floatingParticle} ${styles.p2}`} />
            <div className={`${styles.floatingParticle} ${styles.p3}`} />
            <div className={`${styles.floatingParticle} ${styles.p4}`} />
            <div className={styles.mascotBody}>
              <div ref={mascotBodyRef} className={styles.mascotParallax}>
                <svg
                  className={styles.robotSvg}
                  viewBox="0 0 240 240"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <defs>
                    <linearGradient
                      id="headGrad"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="#ffffff"
                        stopOpacity="0.98"
                      />
                      <stop
                        offset="100%"
                        stopColor="#dbeafe"
                        stopOpacity="0.92"
                      />
                    </linearGradient>
                    <linearGradient
                      id="faceGrad"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="#1e40af"
                        stopOpacity="0.08"
                      />
                      <stop
                        offset="100%"
                        stopColor="#3b82f6"
                        stopOpacity="0.03"
                      />
                    </linearGradient>
                    <radialGradient id="antennaGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <g className={styles.antenna}>
                    <circle cx="120" cy="20" r="16" fill="url(#antennaGlow)" />
                    <line
                      x1="120"
                      y1="24"
                      x2="120"
                      y2="48"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="120" cy="18" r="5" fill="#bfdbfe" />
                    <circle cx="120" cy="18" r="2.5" fill="#3b82f6" />
                  </g>

                  <g ref={robotHeadRef} className={styles.robotHead}>
                    <rect
                      x="50"
                      y="92"
                      width="8"
                      height="28"
                      rx="4"
                      fill="rgba(255,255,255,0.55)"
                    />
                    <rect
                      x="182"
                      y="92"
                      width="8"
                      height="28"
                      rx="4"
                      fill="rgba(255,255,255,0.55)"
                    />
                    <rect
                      x="58"
                      y="48"
                      width="124"
                      height="108"
                      rx="36"
                      fill="url(#headGrad)"
                    />
                    <rect
                      x="72"
                      y="62"
                      width="96"
                      height="80"
                      rx="22"
                      fill="url(#faceGrad)"
                    />

                    <g
                      className={[
                        styles.eyeGroup,
                        styles.eyeLeft,
                        isEyesClosed ? styles.eyesShut : '',
                      ].join(' ')}
                    >
                      <ellipse
                        className={styles.eyeOpen}
                        cx="96"
                        cy="96"
                        rx="16"
                        ry="17"
                        fill="#fff"
                      />
                      <g
                        ref={pupilLeftRef}
                        className={`${styles.pupilGroup} ${styles.eyeOpen}`}
                      >
                        <circle cx="96" cy="96" r="8.5" fill="#1e3a8a" />
                        <circle
                          cx="99"
                          cy="92"
                          r="3.2"
                          fill="#fff"
                          opacity="0.9"
                        />
                      </g>
                      <path
                        className={styles.eyeClosedLine}
                        d="M 80 97 Q 96 103 112 97"
                        stroke="#1e3a8a"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </g>

                    <g
                      className={[
                        styles.eyeGroup,
                        styles.eyeRight,
                        isEyesClosed ? styles.eyesShut : '',
                      ].join(' ')}
                    >
                      <ellipse
                        className={styles.eyeOpen}
                        cx="144"
                        cy="96"
                        rx="16"
                        ry="17"
                        fill="#fff"
                      />
                      <g
                        ref={pupilRightRef}
                        className={`${styles.pupilGroup} ${styles.eyeOpen}`}
                      >
                        <circle cx="144" cy="96" r="8.5" fill="#1e3a8a" />
                        <circle
                          cx="147"
                          cy="92"
                          r="3.2"
                          fill="#fff"
                          opacity="0.9"
                        />
                      </g>
                      <path
                        className={styles.eyeClosedLine}
                        d="M 128 97 Q 144 103 160 97"
                        stroke="#1e3a8a"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </g>

                    <path
                      d="M 108 126 Q 120 134 132 126"
                      stroke="#1e3a8a"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      opacity="0.35"
                    />
                    <ellipse
                      cx="70"
                      cy="116"
                      rx="8"
                      ry="6"
                      fill="rgba(244,114,182,0.22)"
                    />
                    <ellipse
                      cx="170"
                      cy="116"
                      rx="8"
                      ry="6"
                      fill="rgba(244,114,182,0.22)"
                    />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.slogan}>
            <h2>欢迎回来</h2>
            <p>从基础出发，专注于你的应用。</p>
          </div>

          <div ref={decorRef} className={styles.cardLeftDecor} />
          <div ref={decor2Ref} className={styles.cardLeftDecor2} />
        </div>

        <div className={styles.cardRight}>
          <div className={styles.formHeader}>
            <h3>用户登录</h3>
          </div>

          <Form<LoginFormValues>
            form={form}
            size="large"
            layout="vertical"
            requiredMark={false}
            initialValues={
              APP_MOCK_ENABLED
                ? { username: 'admin', password: '123456' }
                : undefined
            }
            onFinish={handleFinish}
            className={styles.loginForm}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                allowClear
                autoComplete="username"
                aria-label="用户名"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input
                prefix={<LockOutlined />}
                type={passwordVisible ? 'text' : 'password'}
                placeholder="请输入密码"
                autoComplete="current-password"
                aria-label="密码"
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                suffix={
                  <span
                    className={styles.passwordEye}
                    role="button"
                    tabIndex={0}
                    aria-label={passwordVisible ? '隐藏密码' : '显示密码'}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setPasswordVisible((visible) => !visible);
                      }
                    }}
                  >
                    {passwordVisible ? (
                      <EyeOutlined />
                    ) : (
                      <EyeInvisibleOutlined />
                    )}
                  </span>
                }
              />
            </Form.Item>

            <div className={styles.submitWrap}>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                block
                loading={loading}
                className={styles.submitBtn}
              >
                登 录
              </Button>
            </div>
          </Form>

          {APP_MOCK_ENABLED ? (
            <p className={styles.demoHint}>
              演示账号：admin / operator / viewer，密码均为 123456
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
