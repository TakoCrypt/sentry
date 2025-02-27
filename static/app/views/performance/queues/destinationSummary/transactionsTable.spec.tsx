import {OrganizationFixture} from 'sentry-fixture/organization';

import {render, screen} from 'sentry-test/reactTestingLibrary';

import useOrganization from 'sentry/utils/useOrganization';
import {TransactionsTable} from 'sentry/views/performance/queues/destinationSummary/transactionsTable';

jest.mock('sentry/utils/useOrganization');

describe('transactionsTable', () => {
  const organization = OrganizationFixture();
  jest.mocked(useOrganization).mockReturnValue(organization);

  let eventsMock;

  const pageLinks =
    '<https://sentry.io/fake/previous>; rel="previous"; results="false"; cursor="0:0:1", ' +
    '<https://sentry.io/fake/next>; rel="next"; results="true"; cursor="0:20:0"';

  beforeEach(() => {
    eventsMock = MockApiClient.addMockResponse({
      url: `/organizations/${organization.slug}/events/`,
      headers: {Link: pageLinks},
      method: 'GET',
      body: {
        data: [
          {
            transaction: 'celery.backend_cleanup',
            'span.op': 'queue.process',
            'count()': 2,
            'count_op(queue.publish)': 0,
            'count_op(queue.process)': 2,
            'sum(span.duration)': 6,
            'avg(span.duration)': 3,
            'avg_if(span.duration,span.op,queue.publish)': 0,
            'avg_if(span.duration,span.op,queue.process)': 3,
            'avg(messaging.message.receive.latency)': 20,
          },
        ],
        meta: {
          fields: {
            'count()': 'integer',
            'count_op(queue.publish)': 'integer',
            'count_op(queue.process)': 'integer',
            'sum(span.duration)': 'duration',
            'avg(span.duration)': 'duration',
            'avg_if(span.duration,span.op,queue.publish)': 'duration',
            'avg_if(span.duration,span.op,queue.process)': 'duration',
            'avg(messaging.message.receive.latency)': 'duration',
          },
        },
      },
    });
  });
  it('renders', async () => {
    render(<TransactionsTable />);
    expect(screen.getByRole('table', {name: 'Transactions'})).toBeInTheDocument();

    expect(screen.getByRole('columnheader', {name: 'Transactions'})).toBeInTheDocument();
    expect(screen.getByRole('columnheader', {name: 'Type'})).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', {name: 'Avg Time in Queue'})
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', {name: 'Avg Processing Time'})
    ).toBeInTheDocument();
    expect(screen.getByRole('columnheader', {name: 'Error Rate'})).toBeInTheDocument();
    expect(screen.getByRole('columnheader', {name: 'Published'})).toBeInTheDocument();
    expect(screen.getByRole('columnheader', {name: 'Processed'})).toBeInTheDocument();
    expect(screen.getByRole('columnheader', {name: 'Time Spent'})).toBeInTheDocument();

    expect(eventsMock).toHaveBeenCalledWith(
      '/organizations/org-slug/events/',
      expect.objectContaining({
        query: expect.objectContaining({
          field: [
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
          dataset: 'spansMetrics',
        }),
      })
    );
    await screen.findByText('celery.backend_cleanup');
    expect(screen.getByRole('cell', {name: '3.00ms'})).toBeInTheDocument();
    expect(screen.getByRole('cell', {name: '2'})).toBeInTheDocument();
    expect(screen.getByRole('cell', {name: '6.00ms'})).toBeInTheDocument();
    expect(screen.getByRole('cell', {name: '20.00ms'})).toBeInTheDocument();
    expect(screen.getByRole('cell', {name: 'Consumer'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Next'})).toBeInTheDocument();
  });
});
