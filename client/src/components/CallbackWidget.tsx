import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Phone, X } from "lucide-react";
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js/max";
import type { CountryCode } from "libphonenumber-js";

const api = (import.meta.env.VITE_API_URL || "http://localhost:3001/api").replace(/\/$/, "");
const regions = new Intl.DisplayNames(["en"], { type: "region" });
const countries = getCountries().sort((a, b) => (regions.of(a) || a).localeCompare(regions.of(b) || b));
export default function CallbackWidget() {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [country, setCountry] = useState<CountryCode>("IN");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [servicesError, setServicesError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const sending = useRef(false);
  const startedAt = useRef(Date.now());
  const request = useRef<{ key: string; fingerprint: string } | null>(null);
  const loadServices = async () => {
    setServicesError(false);
    try {
      const response = await fetch(`${api}/callback/services`, { signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.services) || !data.services.length) throw new Error();
      setServices(data.services);
    } catch { setServicesError(true); }
  };
  useEffect(() => { void loadServices(); }, []);
  useEffect(() => {
    if (open) { dialog.current?.showModal(); dialog.current?.querySelector<HTMLInputElement>("#callback-name")?.focus(); startedAt.current = Date.now(); }
    else { dialog.current?.close(); }
  }, [open]);
  // Avoid the chat composer and any fixed cookie/control panels added by the host.
  useEffect(() => {
    const place = () => {
      if (!button.current) return;
      let bottom = 16;
      const viewport = window.visualViewport;
      const height = viewport?.height || window.innerHeight;
      const width = window.innerWidth;
      const candidates = document.querySelectorAll<HTMLElement>("[data-callback-obstacle], [class*='fixed'], [id*='cookie'], [class*='cookie']");
      for (const element of candidates) {
        if (element === button.current || element.closest(".callback-dialog")) continue;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if ((style.position === "fixed" || element.hasAttribute("data-callback-obstacle")) && rect.width > 0 && rect.height > 0 && rect.bottom > height / 2 && rect.right > width - 88) bottom = Math.max(bottom, height - rect.top + 12);
      }
      button.current.style.bottom = `${Math.min(bottom, height - 72)}px`;
    };
    place();
    const observer = new MutationObserver(place);
    observer.observe(document.getElementById("root")!, { childList: true, subtree: true });
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);
    const timer = window.setInterval(place, 1000);
    return () => { observer.disconnect(); window.removeEventListener("resize", place); window.visualViewport?.removeEventListener("resize", place); clearInterval(timer); };
  }, []);
  const close = () => { setOpen(false); button.current?.focus(); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get("name") || "").trim();
    const rawPhone = String(values.get("phone") || "").trim();
    const phone = parsePhoneNumberFromString(rawPhone, country);
    if (!/^[\p{L}\p{M} .'’-]{2,100}$/u.test(name)) { setError("Please enter your full name using letters."); form.querySelector<HTMLInputElement>("[name=name]")?.focus(); return; }
    if (!phone?.isValid() || phone.countryCallingCode !== getCountryCallingCode(country)) { setError("Please enter a valid phone number for the selected country."); form.querySelector<HTMLInputElement>("[name=phone]")?.focus(); return; }
    const service = String(values.get("service"));
    if (!services.includes(service)) { setError("Please select a service."); return; }
    const fingerprint = JSON.stringify([name, phone.number, service]);
    if (request.current?.fingerprint !== fingerprint) request.current = { key: crypto.randomUUID(), fingerprint };
    sending.current = true; setLoading(true); setError("");
    try {
      const response = await fetch(`${api}/callback`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(20000), body: JSON.stringify({ name, phone: phone.number, service, requestId: request.current!.key, startedAt: startedAt.current, website: values.get("website") || "" }) });
      const result = await response.json().catch(() => ({ message: "The service is temporarily unavailable. Please retry shortly." }));
      if (!response.ok || result.success !== true || !result.id) throw new Error(result.message || "We couldn't confirm your request. Please retry.");
      setSuccess(true);
    } catch (failure) { setError(failure instanceof Error && failure.name !== "TimeoutError" && failure.name !== "TypeError" ? failure.message : "We couldn't confirm your request. Check your connection and retry; your details are still here."); }
    finally { sending.current = false; setLoading(false); }
  };
  return <>
    <button ref={button} type="button" className="callback-launcher" aria-label="Request a callback" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><Phone size={23} /></button>
    <dialog ref={dialog} className="callback-dialog" aria-labelledby="callback-title" aria-describedby="callback-description" onCancel={close} onClose={close} onKeyDown={event => {
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([tabindex="-1"]), select:not(:disabled)')).filter(element => !element.closest('fieldset:disabled'));
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <button type="button" className="callback-close" onClick={close} aria-label="Close callback popup"><X size={22} /></button>
      <h2 id="callback-title">Request a callback</h2>
      <p id="callback-description">Leave your details and our team will contact you shortly.</p>
      {success ? <p className="callback-success" role="status" tabIndex={-1} ref={element => { element?.focus(); }}>Thank you! Our team will contact you shortly.</p> : <form onSubmit={submit} aria-busy={loading}>
        <fieldset disabled={loading}>
          <label htmlFor="callback-name">Name <span aria-hidden="true">*</span></label>
          <input id="callback-name" name="name" required minLength={2} maxLength={100} autoComplete="name" autoFocus />
          <label htmlFor="callback-country">Country code <span aria-hidden="true">*</span></label>
          <select id="callback-country" required value={country} onChange={event => setCountry(event.target.value as CountryCode)} autoComplete="country">{countries.map(code => <option key={code} value={code}>{regions.of(code)} (+{getCountryCallingCode(code)})</option>)}</select>
          <label htmlFor="callback-phone">Phone number <span aria-hidden="true">*</span></label>
          <input id="callback-phone" name="phone" type="tel" inputMode="tel" required maxLength={25} autoComplete="tel-national" placeholder="Your phone number" />
          <label htmlFor="callback-service">Service required <span aria-hidden="true">*</span></label>
          <select id="callback-service" name="service" required defaultValue=""><option value="" disabled>Select a service</option>{services.map(service => <option key={service}>{service}</option>)}</select>
          <div className="callback-honeypot" aria-hidden="true"><label htmlFor="callback-website">Website</label><input id="callback-website" name="website" tabIndex={-1} autoComplete="off" /></div>
        </fieldset>
        {servicesError && <p role="alert">Services could not load. <button type="button" onClick={() => void loadServices()}>Retry loading services</button></p>}
        {error && <p className="callback-error" role="alert">{error}</p>}
        <button className="callback-submit" type="submit" disabled={loading || services.length === 0}>{loading ? "Sending…" : error ? "Retry — Call Me Back" : "Call Me Back"}</button>
      </form>}
    </dialog>
  </>;
}
