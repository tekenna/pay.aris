"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import { useBusinessSession } from "@/store/business-session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, SearchIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { merchantApi } from "@/lib/merchant-api";
import type { BusinessTransaction } from "@/lib/types";

export default function WithdrawPage() {
  const { session } = useBusinessSession();
  const [transactions, setTransactions] = useState<BusinessTransaction[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadTransactions() {
      if (!session?.token) {
        return;
      }

      const params = new URLSearchParams({
        page: "1",
        limit: "6",
        status: "success",
      });
      const response = await merchantApi.getTransactions(session.token, params);
      if (response.statusCode === 200) {
        setTransactions(response.data);
      }
    }

    void loadTransactions();
  }, [session?.token]);

  const recipients = useMemo(
    () =>
      transactions.map((item) => ({
        id: item._id,
        name: item.customer?.name || item.customer?.email || "Beneficiary",
        accountNumber: item.virtualAccount?.accountNumber || "0123456789",
        bankName: item.virtualAccount?.bankName || "Safehaven MFB",
      })),
    [transactions],
  );

  return (
    <MerchantShell title="Withdraw">
      <Link href="/dashboard/accounts" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500">
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <Card className="p-6">
          <p className="text-lg font-semibold text-slate-950">Add Recipient Details</p>
          <form
            className="mt-6 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setNotice("Withdrawal initiation is pending a dedicated merchant transfer endpoint.");
            }}
          >
            <Input label="Account Number" defaultValue="1234123412341234" />
            <Input label="Bank" defaultValue="Guaranty Trust Bank" />
            <Input label="Amount" defaultValue="N12000.00" />
            <Input label="Narration (Optional)" />
            {notice ? <p className="rounded-[10px] bg-slate-50 px-4 py-3 text-sm text-slate-500">{notice}</p> : null}
            <Button type="submit" className="ml-auto min-w-[150px]">
              Continue
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <p className="text-lg font-semibold text-slate-950">Recent Transfers</p>
          <div className="relative mt-5">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
            <input
              placeholder="Search by Name"
              className="h-10 w-full rounded-[10px] border border-transparent bg-slate-50 pl-11 pr-4 text-sm outline-none"
            />
          </div>

          <div className="mt-6 grid gap-5">
            {recipients.map((recipient, index) => (
              <div key={recipient.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-800">{recipient.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {recipient.accountNumber} - {recipient.bankName}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
                    ["bg-orange-500", "bg-blue-500", "bg-amber-400", "bg-red-500"][index % 4]
                  }`}
                >
                  {recipient.name.charAt(0)}
                </div>
              </div>
            ))}
            {!recipients.length ? (
              <p className="text-sm text-slate-400">Recent transfer recipients will appear here once transactions exist.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </MerchantShell>
  );
}
