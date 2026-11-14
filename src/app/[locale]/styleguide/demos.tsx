"use client";

import { useCallback, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Chip, FilterChip } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { Select, TextArea, TextField } from "@/components/ui/field";
import { FileUpload } from "@/components/ui/file-upload";
import { SearchField } from "@/components/ui/search-field";
import { SliderInput } from "@/components/ui/slider-input";
import { StarInput } from "@/components/ui/star-input";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { formatNpr } from "@/lib/format";
import { sampleConsultancies } from "./fixtures";

// The demos below use short English or Nepali sample labels. They are not interface text.
const copy = {
  en: {
    honesty: "Honesty", charge: "Service charge", none: "Rs 0", max: "Rs 2,00,000",
    filters: ["Australia", "Visa granted", "Verified only"], plain: "Bachelor",
    tabs: ["Australia", "Japan", "United Kingdom", "United States", "Canada"], tabBody: "Top rated for",
    name: "Your name", nameHint: "You choose later how it is shown.", story: "What went well", optional: "optional",
    level: "Study level", levels: ["Bachelor", "Master", "Diploma"], error: "Please write at least 20 characters.",
    proof: "Proof (optional)", proofHint: "A visa page, offer letter or receipt.", privacy: "Only our team sees this. We delete it after checking.",
    toastOk: "Show a success message", toastBad: "Show an error message", saved: "Your draft is saved.", failed: "That did not work. Please try again.",
    openDialog: "Open the dialog", dialogTitle: "Reject this review", dialogBody: "Give a short reason. The reviewer will see it.", cancel: "Cancel", confirm: "Reject",
    picked: "You picked", searched: "You searched for", tryIt: "Type \"ex\" or \"demo\".",
  },
  ne: {
    honesty: "इमानदारी", charge: "सेवा शुल्क", none: "रु ०", max: "रु २,००,०००",
    filters: ["अस्ट्रेलिया", "भिसा पाएको", "प्रमाणित मात्र"], plain: "स्नातक",
    tabs: ["अस्ट्रेलिया", "जापान", "बेलायत", "अमेरिका", "क्यानडा"], tabBody: "उत्कृष्ट मूल्याङ्कन:",
    name: "तपाईंको नाम", nameHint: "नाम कसरी देखाउने भन्ने पछि छान्न सक्नुहुन्छ।", story: "के राम्रो भयो", optional: "ऐच्छिक",
    level: "अध्ययन तह", levels: ["स्नातक", "स्नातकोत्तर", "डिप्लोमा"], error: "कम्तीमा २० अक्षर लेख्नुहोस्।",
    proof: "प्रमाण (ऐच्छिक)", proofHint: "भिसा पाना, अफर लेटर वा रसिद।", privacy: "यो हाम्रो टोलीले मात्र हेर्छ। जाँचेपछि हामी यसलाई मेटाउँछौँ।",
    toastOk: "सफलताको सूचना देखाउनुहोस्", toastBad: "त्रुटिको सूचना देखाउनुहोस्", saved: "तपाईंको मस्यौदा सुरक्षित भयो।", failed: "काम भएन। फेरि प्रयास गर्नुहोस्।",
    openDialog: "संवाद खोल्नुहोस्", dialogTitle: "यो समीक्षा अस्वीकार गर्नुहोस्", dialogBody: "छोटो कारण लेख्नुहोस्। समीक्षकले यो देख्नेछन्।", cancel: "रद्द", confirm: "अस्वीकार",
    picked: "तपाईंले छान्नुभयो:", searched: "तपाईंले खोज्नुभयो:", tryIt: "\"ex\" वा \"demo\" टाइप गर्नुहोस्।",
  },
} as const;

function useCopy() {
  return useLocale() === "ne" ? copy.ne : copy.en;
}

export function SearchDemo({ size }: { size: "md" | "hero" }) {
  const c = useCopy();
  const [note, setNote] = useState<string>(c.tryIt);
  const search = useCallback(async (query: string) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const q = query.toLowerCase();
    return sampleConsultancies.filter((item) => item.name.toLowerCase().includes(q));
  }, []);
  return (
    <div>
      <SearchField
        size={size}
        search={search}
        onSelect={(item) => setNote(`${c.picked} ${item.name}`)}
        onSubmit={(query) => setNote(`${c.searched} ${query}`)}
      />
      <p className="mt-3 text-small text-ink-soft">{note}</p>
    </div>
  );
}

export function InputsDemo() {
  const c = useCopy();
  const [stars, setStars] = useState<number | null>(4);
  const [amount, setAmount] = useState(45000);
  const locale = useLocale();
  return (
    <div className="grid gap-8">
      <StarInput label={c.honesty} name={`honesty-${locale}`} value={stars} onChange={setStars} />
      <SliderInput
        label={c.charge}
        min={0}
        max={200000}
        step={5000}
        value={amount}
        onChange={setAmount}
        formatValue={(v) => formatNpr(v, locale)}
        minLabel={c.none}
        maxLabel={c.max}
      />
    </div>
  );
}

export function ChipsDemo() {
  const c = useCopy();
  const [on, setOn] = useState<Record<string, boolean>>({ [c.filters[1]]: true });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip>{c.plain}</Chip>
      {c.filters.map((label) => (
        <FilterChip key={label} selected={!!on[label]} onToggle={(next) => setOn({ ...on, [label]: next })}>
          {label}
        </FilterChip>
      ))}
    </div>
  );
}

export function TabsDemo({ size }: { size: "md" | "big" }) {
  const c = useCopy();
  const [value, setValue] = useState("0");
  return (
    <Tabs
      label={c.tabBody}
      size={size}
      value={value}
      onChange={setValue}
      items={c.tabs.map((label, i) => ({
        id: String(i),
        label,
        content: (
          <p className="text-ink-soft">
            {c.tabBody} {label}
          </p>
        ),
      }))}
    />
  );
}

export function FieldsDemo() {
  const c = useCopy();
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="grid gap-6">
      <TextField label={c.name} hint={c.nameHint} optionalLabel={c.optional} autoComplete="name" />
      <TextArea label={c.story} error={c.error} defaultValue="OK" rows={3} />
      <Select label={c.level} defaultValue={c.levels[0]}>
        {c.levels.map((level) => (
          <option key={level}>{level}</option>
        ))}
      </Select>
      <FileUpload
        label={c.proof}
        hint={c.proofHint}
        privacyNote={c.privacy}
        accept="image/jpeg,image/png,application/pdf"
        maxBytes={5 * 1024 * 1024}
        file={file}
        onChange={setFile}
      />
    </div>
  );
}

export function FeedbackDemo() {
  const c = useCopy();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => toast(c.saved)}>
        {c.toastOk}
      </Button>
      <Button variant="secondary" onClick={() => toast(c.failed, "bad")}>
        {c.toastBad}
      </Button>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {c.openDialog}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={c.dialogTitle}
        actions={
          <>
            <Button variant="quiet" onClick={() => setOpen(false)}>
              {c.cancel}
            </Button>
            <Button onClick={() => setOpen(false)}>{c.confirm}</Button>
          </>
        }
      >
        <p className="text-ink-soft">{c.dialogBody}</p>
      </Dialog>
    </div>
  );
}
