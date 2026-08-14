import type { ReactNode } from 'react';
import { Button, Card, Steps, Divider, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';

interface StepDef {
  title: string;
  description?: string;
  content: ReactNode;
}

interface FullPageFormProps {
  title: string;
  subtitle?: string;
  steps: StepDef[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitText?: string;
  submitLoading?: boolean;
  extra?: ReactNode;
}

const FullPageForm = ({
  title,
  subtitle,
  steps,
  currentStep,
  onStepChange,
  onSubmit,
  onCancel,
  submitText = 'Save',
  submitLoading,
  extra,
}: FullPageFormProps) => {
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const isSingleStep = steps.length === 1;

  return (
    <div className="page-container" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onCancel}
            type="text"
            style={{ marginRight: 12, fontSize: 14 }}
          >
            Back
          </Button>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
        {extra}
      </div>

      {!isSingleStep && (
        <Steps
          current={currentStep}
          items={steps.map((s) => ({
            title: s.title,
            description: s.description,
          }))}
          style={{ marginBottom: 24 }}
        />
      )}

      <Card
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: '32px 32px 16px' } }}
      >
        {steps[currentStep]?.content}
      </Card>

      <Divider style={{ margin: '16px 0' }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingBottom: 24,
        }}
      >
        <div>
          {!isFirstStep && !isSingleStep && (
            <Button size="large" onClick={() => onStepChange(currentStep - 1)}>
              Previous
            </Button>
          )}
        </div>
        <Space>
          <Button size="large" onClick={onCancel}>
            Cancel
          </Button>
          {isSingleStep || isLastStep ? (
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={onSubmit}
              loading={submitLoading}
            >
              {submitText}
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              onClick={() => onStepChange(currentStep + 1)}
            >
              Next
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
};

export default FullPageForm;
