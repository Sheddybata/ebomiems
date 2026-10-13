import { Banner, PageTitle, inputClass, labelClass } from "@/components/ui";
import { saveSettings } from "@/lib/actions";
import { getSettings } from "@/lib/repo";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const query = await searchParams;
  const settings = getSettings();
  return (
    <div>
      <PageTitle title="School settings" lede="Bank details are what parents copy. The report lock holds a published term until that term’s own charges are covered. A later bill does not hide a term that was already paid." />
      <Banner error={query.error} ok={query.ok} />
      <form action={saveSettings} className="grid max-w-3xl gap-3 rounded-lg border border-line bg-card p-4 md:grid-cols-2">
        <label className="text-sm"><span className={labelClass}>School name</span><input name="schoolName" defaultValue={settings.school_name} className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Motto</span><input name="motto" defaultValue={settings.motto} className={inputClass} /></label>
        <label className="text-sm md:col-span-2"><span className={labelClass}>Address</span><input name="address" defaultValue={settings.address} className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Phone</span><input name="phone" defaultValue={settings.phone} className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Email</span><input name="email" defaultValue={settings.email} className={inputClass} /></label>
        <label className="text-sm md:col-span-2"><span className={labelClass}>Principal</span><input name="principalName" defaultValue={settings.principal_name} className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Bank</span><input name="bankName" defaultValue={settings.bank_name} className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Account name</span><input name="accountName" defaultValue={settings.account_name} className={inputClass} /></label>
        <label className="text-sm md:col-span-2"><span className={labelClass}>Account number</span><input name="accountNumber" defaultValue={settings.account_number} className={inputClass} /></label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input name="reportLock" type="checkbox" defaultChecked={settings.report_lock === 1} />
          Hold the official report when that term’s fees are still open
        </label>
        <button className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Save settings</button>
      </form>
    </div>
  );
}
