import { Skeleton, Row, Col, Card } from 'antd';

interface PageLoaderProps {
  cards?: number;
  table?: boolean;
}

const PageLoader = ({ cards = 4, table = true }: PageLoaderProps) => (
  <div className="page-loader" style={{ animation: 'none' }}>
    <Row gutter={[20, 20]}>
      {Array.from({ length: cards }).map((_, i) => (
        <Col xs={24} sm={12} md={24 / Math.min(cards, 4)} key={i}>
          <Card styles={{ body: { padding: 20 } }}>
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
          </Card>
        </Col>
      ))}
    </Row>
    {table && (
      <Card styles={{ body: { padding: 20 } }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    )}
  </div>
);

export default PageLoader;
