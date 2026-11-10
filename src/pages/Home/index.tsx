import PageHeader from '@/components/PageHeader';
import { findRouteByComponent } from '@/router';
import { useRouteStore } from '@/stores/routes';
import { history, useModel } from '@umijs/max';
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import React from 'react';
import styles from './index.less';

const FEATURES = [
  {
    tag: '请求',
    desc: '基于 umi request 的统一封装，自动处理 code/data/msg 与 401 跳转',
  },
  {
    tag: '鉴权',
    desc: '页面守卫、登录回跳、会话过期与跨窗口退出同步',
  },
  {
    tag: '布局',
    desc: '路由驱动的管理后台布局，深色侧边栏 + 固定头部 + 多页签',
  },
  {
    tag: '路由',
    desc: '业务路由由接口下发；菜单、面包屑与页面导航使用同一份配置',
  },
];

const HomePage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const routes = useRouteStore((state) => state.routes);
  const examplePath = findRouteByComponent('Example', routes)?.path;

  return (
    <div className={styles.page}>
      <PageHeader title="首页" description="框架概览与示例入口" />

      <div className={styles.container}>
        <section className={styles.hero}>
          <div>
            <Typography.Title level={2} className={styles.heroTitle}>
              你好，{initialState?.name || '朋友'}
            </Typography.Title>
            <Typography.Paragraph className={styles.heroDesc}>
              这是一个基于 Umi Max + Ant Design 6 + ProComponents 3
              的基础框架。列表示例演示分页查询与增删改，应用配置、路由和公共布局独立维护。
            </Typography.Paragraph>
          </div>
          <Button
            type="primary"
            size="large"
            disabled={!examplePath}
            onClick={() => examplePath && history.push(examplePath)}
          >
            查看示例页面
          </Button>
        </section>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Typography.Text type="secondary">路由来源</Typography.Text>
              <Typography.Title level={3} className={styles.statValue}>
                后端接口
              </Typography.Title>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Typography.Text type="secondary">开发数据</Typography.Text>
              <Typography.Title level={3} className={styles.statValue}>
                {APP_MOCK_ENABLED ? 'Mock 已开启' : '真实接口'}
              </Typography.Title>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Typography.Text type="secondary">登录态</Typography.Text>
              <Typography.Title level={3} className={styles.statValue}>
                <Tag color="success">已登录</Tag>
              </Typography.Title>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Typography.Text type="secondary">技术栈</Typography.Text>
              <Typography.Title level={3} className={styles.statValue}>
                React 18
              </Typography.Title>
            </Card>
          </Col>
        </Row>

        <Card title="模板能力" className={styles.card}>
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            {FEATURES.map((item) => (
              <div key={item.tag} className={styles.feature}>
                <Tag color="blue">{item.tag}</Tag>
                <span className={styles.featureDesc}>{item.desc}</span>
              </div>
            ))}
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
