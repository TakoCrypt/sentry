import {decodeScalar} from 'sentry/utils/queryString';
import {MutableSearch} from 'sentry/utils/tokenizeSearch';
import {useLocation} from 'sentry/utils/useLocation';
import {DEFAULT_QUERY_FILTER} from 'sentry/views/performance/queues/settings';
import {useSpanMetrics} from 'sentry/views/starfish/queries/useDiscover';
import {QueryParameterNames} from 'sentry/views/starfish/views/queryParameters';

type Props = {
  destination?: string;
  enabled?: boolean;
};

export function useQueuesByTransactionQuery({destination, enabled}: Props) {
  const location = useLocation();
  const cursor = decodeScalar(location.query?.[QueryParameterNames.TRANSACTIONS_CURSOR]);

  const mutableSearch = new MutableSearch(DEFAULT_QUERY_FILTER);
  if (destination) {
    mutableSearch.addFilterValue('messaging.destination.name', destination);
  }
  const response = useSpanMetrics(
    {
      search: mutableSearch,
      fields: [
        'transaction',
        'span.op',
        'count()',
        'count_op(queue.publish)',
        'count_op(queue.process)',
        'sum(span.duration)',
        'avg(span.duration)',
        'avg_if(span.duration,span.op,queue.publish)',
        'avg_if(span.duration,span.op,queue.process)',
        'avg(messaging.message.receive.latency)',
      ],
      enabled,
      sorts: [],
      limit: 10,
      cursor,
    },
    'api.performance.queues.destination-summary'
  );

  return response;
}
