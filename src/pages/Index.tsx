import React from 'react';
import LearningPlatform from '@/components/LearningPlatform';
import Seo from '@/components/Seo';

const Index: React.FC = () => {
  return (
    <>
      <Seo
        title="لوحة التعلّم — منصة درس خصوصي"
        description="ابدأ التعلّم مع المعلم الذكي، أنشئ خرائط ذهنية، بسّط الدروس، وولّد بطاقات مراجعة واختبارات فهم مخصّصة لك في منصة درس خصوصي."
        path="/app"
      />
      <LearningPlatform />
    </>
  );
};

export default Index;
