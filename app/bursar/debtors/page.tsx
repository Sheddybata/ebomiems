import Link from "next/link";
import { Fragment } from "react";
import { PageTitle } from "@/components/ui";
import { PrintButton } from "@/components/widgets";
import { classLabel, formatPhone, personName } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { getSettings, listDebtors } from "@/lib/repo";

export default async function DebtorsPage() {
  const debtors = (await listDebtors());
  const settings = (await getSettings());
  const total = debtors.reduce((sum, pupil) => sum + pupil.balance_kobo, 0);
  let lastClass = "";
  return (
    <div>
      <div className="no-print mb-4 flex items-end justify-between">
        <PageTitle title="Debtors" lede={`${debtors.length} families · ${formatNaira(total)} still on the ledger.`} />
        <PrintButton label="Print list" />
      </div>
      <article className="rounded-lg border border-line bg-white p-4">
        <p className="text-center font-serif text-xl">{settings.school_name}</p>
        <p className="text-center text-sm">Outstanding fees</p>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-muted"><th className="py-1">Learner</th><th>Admission</th><th>Parent phone</th><th>Outstanding</th></tr>
          </thead>
          <tbody>
            {debtors.map((pupil) => {
              const label = classLabel(pupil.class_name, pupil.class_arm);
              const show = label !== lastClass;
              lastClass = label;
              return (
                <Fragment key={pupil.id}>
                  {show ? <tr><td colSpan={4} className="bg-paper px-1 py-1 font-semibold">{label}</td></tr> : null}
                  <tr className="border-t border-line">
                    <td className="py-1"><Link className="font-semibold text-moss" href={`/bursar/collect?student=${pupil.id}`}>{personName(pupil)}</Link></td>
                    <td>{pupil.admission_no}</td>
                    <td>{formatPhone(pupil.parent_phone)}</td>
                    <td className="tabular-nums">{formatNaira(pupil.balance_kobo)}</td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </article>
    </div>
  );
}
