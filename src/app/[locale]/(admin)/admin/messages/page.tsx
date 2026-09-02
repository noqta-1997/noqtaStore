import { Mail, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteContactMessage, removeSubscriber } from "@/app/actions/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { MessageActions } from "@/components/admin/message-actions";
import { TableToolbar, type ToolbarTab } from "@/components/admin/table-toolbar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import {
  getContactMessageCounts,
  getContactMessages,
  getNewsletterSubscribers,
} from "@/data";
import { isLocale, localeNames } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatDate } from "@/lib/format";
import {
  buildQueryString,
  readNumberParam,
  readParam,
  type SearchParamsRecord,
} from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { ContactStatus } from "@/types";

interface MessagesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({
  params,
}: MessagesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const admin = await getAdminDictionary(isLocale(locale) ? locale : "ar");

  return { title: `${admin.messages.title} — ${admin.brand.panel}` };
}

const statuses: ContactStatus[] = ["new", "read"];

const statusTones: Record<ContactStatus, string> = {
  new: "border-line bg-primary-fixed text-on-primary-fixed",
  read: "border-line bg-surface-low text-on-surface-variant",
};

export default async function AdminMessagesPage({
  params,
  searchParams,
}: MessagesPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const raw = await searchParams;
  const term = readParam(raw, "q");
  const rawStatus = readParam(raw, "status");
  const status = statuses.includes(rawStatus as ContactStatus) ? rawStatus! : "all";
  const page = readNumberParam(raw, "page") ?? 1;
  const subscribersView = readParam(raw, "view") === "subscribers";

  const [dictionary, admin, counts, result, subscribers] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getContactMessageCounts(),
    subscribersView
      ? Promise.resolve(null)
      : getContactMessages({ q: term, status, page, perPage: 10 }),
    subscribersView
      ? getNewsletterSubscribers({ q: term, page, perPage: 10 })
      : Promise.resolve(null),
  ]);

  const t = admin.messages;
  const base = `/${locale}/admin/messages`;
  const listed = subscribersView ? subscribers! : result!;

  const tabs: ToolbarTab[] = subscribersView
    ? []
    : (
        [
          { value: "all", label: admin.common.all, count: counts.all },
          { value: "new", label: t.statuses.new, count: counts.new },
          { value: "read", label: t.statuses.read, count: counts.read },
        ] as const
      ).map((tab) => ({
        ...tab,
        href: `${base}${buildQueryString({
          q: term,
          status: tab.value === "all" ? undefined : tab.value,
        })}`,
        active: status === tab.value,
      }));

  const views = [
    { key: "messages", label: t.views.messages, href: base, active: !subscribersView },
    {
      key: "subscribers",
      label: t.views.subscribers,
      href: `${base}?view=subscribers`,
      active: subscribersView,
    },
  ];

  return (
    <>
      <AdminPageHeader title={t.title} subtitle={t.subtitle} />

      <nav className="flex flex-wrap gap-px">
        {views.map((view) => (
          <Link
            key={view.key}
            href={view.href}
            aria-current={view.active ? "page" : undefined}
            className={cn(
              "rounded-full border border-line px-4 py-2 text-label-md transition-colors duration-100 ease-fluent",
              view.active
                ? "bg-primary-container font-semibold text-on-primary-container"
                : "bg-card text-on-surface-variant hover:bg-state-hover hover:text-on-surface",
            )}
          >
            {view.label}
          </Link>
        ))}
      </nav>

      <TableToolbar
        action={base}
        searchLabel={admin.common.search}
        searchPlaceholder={t.searchPlaceholder}
        defaultValue={term}
        hiddenFields={{
          status: subscribersView || status === "all" ? undefined : status,
          view: subscribersView ? "subscribers" : undefined,
        }}
        tabs={tabs}
      />

      {listed.items.length ? (
        <>
          {subscribersView ? (
            <Table minWidth="38rem">
              <Thead>
                <Tr>
                  <Th>{t.table.email}</Th>
                  <Th>{t.table.language}</Th>
                  <Th>{t.table.joinedAt}</Th>
                  <Th className="text-end">{admin.common.actions}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {subscribers!.items.map((subscriber) => (
                  <Tr key={subscriber.email}>
                    <Td className="whitespace-nowrap font-semibold" dir="ltr">
                      {subscriber.email}
                    </Td>
                    <Td className="whitespace-nowrap text-on-surface-variant">
                      {isLocale(subscriber.locale)
                        ? localeNames[subscriber.locale]
                        : subscriber.locale}
                    </Td>
                    <Td className="whitespace-nowrap text-on-surface-variant" data-numeric>
                      {formatDate(subscriber.createdAt, locale)}
                    </Td>
                    <Td>
                      <div className="flex justify-end">
                        <ConfirmDialog
                          labels={t.confirmUnsubscribe}
                          action={removeSubscriber.bind(null, subscriber.email)}
                          errorMessages={dictionary.common.actionErrors}
                          fallbackError={dictionary.common.toast.actionFailed}
                          itemName={subscriber.email}
                          className="size-9"
                        />
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Table minWidth="60rem">
              <Thead>
                <Tr>
                  <Th>{t.table.sender}</Th>
                  <Th>{t.table.subject}</Th>
                  <Th>{t.table.message}</Th>
                  <Th>{t.table.date}</Th>
                  <Th>{admin.common.status}</Th>
                  <Th className="text-end">{admin.common.actions}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {result!.items.map((message) => (
                  <Tr key={message.id}>
                    <Td>
                      <span className="block font-semibold text-on-surface">
                        {message.name}
                      </span>
                      <a
                        href={`mailto:${message.email}`}
                        dir="ltr"
                        className="block text-label-md text-muted underline-offset-4 hover:underline"
                      >
                        {message.email}
                      </a>
                    </Td>
                    <Td className="max-w-52 truncate">{message.subject}</Td>
                    <Td>
                      <span className="block max-w-80 truncate text-on-surface-variant">
                        {message.message}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-on-surface-variant" data-numeric>
                      {formatDate(message.createdAt, locale)}
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-label-md font-semibold",
                          statusTones[message.status],
                        )}
                      >
                        {t.statuses[message.status]}
                      </span>
                    </Td>
                    <Td>
                      <MessageActions
                        messageId={message.id}
                        status={message.status}
                        subject={message.subject}
                        confirm={t.confirmDelete}
                        deleteAction={deleteContactMessage.bind(null, message.id)}
                        errorMessages={dictionary.common.actionErrors}
                        labels={{
                          markRead: t.markRead,
                          markNew: t.markNew,
                          saved: dictionary.common.toast.saved,
                          failure: dictionary.common.toast.actionFailed,
                        }}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}

          <Pagination
            page={listed.page}
            pageCount={listed.pageCount}
            buildHref={(next) =>
              `${base}${buildQueryString({
                q: term,
                view: subscribersView ? "subscribers" : undefined,
                status: subscribersView || status === "all" ? undefined : status,
                page: next > 1 ? next : undefined,
              })}`
            }
            labels={{
              previous: dictionary.common.previous,
              next: dictionary.common.next,
              page: dictionary.common.page,
            }}
          />
        </>
      ) : (
        <EmptyState
          icon={subscribersView ? Users : Mail}
          title={subscribersView ? t.emptySubscribers.title : t.empty.title}
          description={
            subscribersView ? t.emptySubscribers.description : t.empty.description
          }
          actionLabel={admin.common.all}
          actionHref={subscribersView ? `${base}?view=subscribers` : base}
        />
      )}
    </>
  );
}
