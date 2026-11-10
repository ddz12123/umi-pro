import ExceptionPage from '@/components/ExceptionPage';
import React from 'react';

const ServerErrorPage: React.FC = () => <ExceptionPage status={500} />;

export default ServerErrorPage;
