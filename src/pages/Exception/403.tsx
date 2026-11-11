import ExceptionPage from '@/components/ExceptionPage';
import React from 'react';

const ForbiddenPage: React.FC = () => <ExceptionPage status={403} />;

export default ForbiddenPage;
