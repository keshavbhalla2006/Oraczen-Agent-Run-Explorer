import Link from "next/link";
import { buildRunsHref, type RunQuery } from "@/lib/query";

interface Props {
  query: RunQuery;
  total: number;
  pageSize: number;
}

export default function Pagination({ query, total, pageSize }: Props) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (query.page - 1) * pageSize + 1;
  const to = Math.min(query.page * pageSize, total);

  return (
    <div className="pagination">
      <span>
        Showing {from}–{to} of {total}
      </span>
      <span className="pager">
        {query.page > 1 ? (
          <Link href={buildRunsHref(query, { page: query.page - 1 })}>← Previous</Link>
        ) : (
          <span className="disabled">← Previous</span>
        )}
        <span>
          Page {query.page} of {lastPage}
        </span>
        {query.page < lastPage ? (
          <Link href={buildRunsHref(query, { page: query.page + 1 })}>Next →</Link>
        ) : (
          <span className="disabled">Next →</span>
        )}
      </span>
    </div>
  );
}