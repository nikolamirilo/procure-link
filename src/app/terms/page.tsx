import { getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata = {
  title: "Uslovi korišćenja - ProcureLink",
  description:
    "Uslovi korišćenja ProcureLink platforme - tržište, softverska naknada, rešavanje sporova.",
};

// NOTE FOR FOUNDER: replace placeholders and have a Serbian lawyer review the
// software-fee / payment-services and fiscalization questions before billing.
const CONTROLLER = "[Naziv pravnog lica d.o.o., PIB, adresa u Srbiji]";
const COMPLAINTS_EMAIL = "podrska@procure-link.com";

export default async function TermsPage() {
  const locale = (await getLocale()) as Locale;
  const sr = locale === "sr";

  return (
    <LegalShell
      title={sr ? "Uslovi korišćenja" : "Terms of Service"}
      subtitle={
        sr
          ? "Pravila korišćenja ProcureLink platforme za restorane i dobavljače."
          : "The rules for using the ProcureLink platform for restaurants and suppliers."
      }
      backLabel={sr ? "Nazad na početnu" : "Back to home"}
      lastUpdated={sr ? "Poslednje ažuriranje: jun 2026." : "Last updated: June 2026"}
    >
      {sr ? (
        <>
          <section>
            <h2>1. Pružalac usluge</h2>
            <p>ProcureLink platformu pruža {CONTROLLER} (dalje: Platforma).</p>
          </section>
          <section>
            <h2>2. Uloga tržišta</h2>
            <p>
              ProcureLink je posrednička platforma (tržište) koja povezuje restorane i
              dobavljače. Ugovor o kupoprodaji robe zaključuje se isključivo između
              restorana i dobavljača. Platforma nije strana u toj kupoprodaji, ne
              poseduje robu i ne odgovara za kvalitet, isporuku ili plaćanje između
              strana.
            </p>
          </section>
          <section>
            <h2>3. Softverska naknada</h2>
            <p>
              Naplaćujemo isključivo mesečnu softversku naknadu dobavljačima za
              korišćenje Platforme. Ne naplaćujemo proviziju po transakciji niti
              posredujemo u plaćanju između restorana i dobavljača - novac za robu nikada
              ne prolazi kroz Platformu. Iznos naknade i uslovi prikazani su na stranici
              pretplate i mogu se menjati uz prethodno obaveštenje.
            </p>
          </section>
          <section>
            <h2>4. Rešavanje sporova između strana</h2>
            <p>
              Sporove oko robe, isporuke ili plaćanja restoran i dobavljač rešavaju
              međusobno. Možemo pomoći u posredovanju, ali nismo obavezni i ne snosimo
              odgovornost za ishod.
            </p>
          </section>
          <section>
            <h2>5. Transparentnost rangiranja (Uredba P2B 2019/1150)</h2>
            <p>
              U pregledu proizvoda i dobavljača podrazumevani redosled je po nazivu
              (azbučno), osim ako ne odaberete drugačije filtriranje. Ne naplaćujemo
              bolje pozicioniranje u rezultatima.
            </p>
          </section>
          <section>
            <h2>6. Pritužbe</h2>
            <p>
              Pritužbe u vezi sa Platformom šaljite na{" "}
              <a href={`mailto:${COMPLAINTS_EMAIL}`}>{COMPLAINTS_EMAIL}</a>. Odgovaramo u
              razumnom roku, najkasnije u roku propisanom važećim propisima.
            </p>
          </section>
          <section>
            <h2>7. Prestanak naloga</h2>
            <p>
              Nalog možete zatvoriti u svakom trenutku iz podešavanja. Možemo
              suspendovati nalog u slučaju kršenja ovih uslova ili zloupotrebe.
            </p>
          </section>
          <section>
            <h2>8. Merodavno pravo</h2>
            <p>
              Na ove uslove primenjuje se pravo Republike Srbije. Za sporove je nadležan
              stvarno nadležan sud u Srbiji.
            </p>
          </section>
        </>
      ) : (
        <>
          <section>
            <h2>1. Provider</h2>
            <p>The ProcureLink platform is provided by {CONTROLLER} (the Platform).</p>
          </section>
          <section>
            <h2>2. Marketplace role</h2>
            <p>
              ProcureLink is an intermediary platform (marketplace) connecting restaurants
              and suppliers. Any contract for the sale of goods is concluded solely between
              the restaurant and the supplier. The Platform is not a party to that sale,
              does not own the goods, and is not liable for quality, delivery, or payment
              between the parties.
            </p>
          </section>
          <section>
            <h2>3. Software fee</h2>
            <p>
              We charge only a monthly software fee to suppliers for using the Platform. We
              do not charge per-transaction commission and we do not intermediate payments
              between restaurants and suppliers - money for goods never flows through the
              Platform. Fee amounts and terms are shown on the subscription page and may
              change with prior notice.
            </p>
          </section>
          <section>
            <h2>4. Dispute resolution between parties</h2>
            <p>
              Disputes over goods, delivery, or payment are resolved directly between the
              restaurant and supplier. We may help mediate but are not obligated to and bear
              no liability for the outcome.
            </p>
          </section>
          <section>
            <h2>5. Ranking transparency (P2B Regulation 2019/1150)</h2>
            <p>
              In product and supplier browsing, the default order is by name (alphabetical)
              unless you choose another filter. We do not charge for better placement in
              results.
            </p>
          </section>
          <section>
            <h2>6. Complaints</h2>
            <p>
              Send Platform complaints to{" "}
              <a href={`mailto:${COMPLAINTS_EMAIL}`}>{COMPLAINTS_EMAIL}</a>. We respond
              within a reasonable time and no later than any statutory deadline.
            </p>
          </section>
          <section>
            <h2>7. Account termination</h2>
            <p>
              You may close your account at any time from settings. We may suspend an account
              for breach of these terms or abuse.
            </p>
          </section>
          <section>
            <h2>8. Governing law</h2>
            <p>
              These terms are governed by the law of the Republic of Serbia, with competent
              Serbian courts having jurisdiction over disputes.
            </p>
          </section>
        </>
      )}
    </LegalShell>
  );
}
