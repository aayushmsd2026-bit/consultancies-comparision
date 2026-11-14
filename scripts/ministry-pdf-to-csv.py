#!/usr/bin/env python3
"""
Turns the Ministry of Education PDF list into the CSV file the import script reads.

    python3 scripts/ministry-pdf-to-csv.py data/source/ministry-list-fy-2081-82.pdf data/consultancies.csv

Needs:  pip install pdfplumber

The PDF has four columns: serial number, name, address, approval date.
It has no registration numbers, phone numbers, websites or countries, so those
CSV columns stay empty. City and district are a best guess from the address.
Check the rows marked in the "check" column by hand.
"""
import csv
import re
import sys

import pdfplumber

# (words to look for in the address, city, district). The first match wins,
# so places outside Kathmandu come first.
PLACES = [
    (["pokhara", "prithvi chowk", "prithivi chowk", "chipledhunga", "mahendrapool", "newroad pokhara", "kaski"], "Pokhara", "Kaski"),
    (["bharatpur", "narayangarh", "narayanghat", "chitwan", "chitawan"], "Bharatpur", "Chitwan"),
    (["butwal"], "Butwal", "Rupandehi"),
    (["bhairahawa", "siddharthanagar", "siddharthnagar", "rupandehi"], "Siddharthanagar", "Rupandehi"),
    (["biratnagar"], "Biratnagar", "Morang"),
    (["urlabari", "morang"], "", "Morang"),
    (["dharan"], "Dharan", "Sunsari"),
    (["itahari", "sunsari"], "Itahari", "Sunsari"),
    (["birtamod", "birtamode"], "Birtamod", "Jhapa"),
    (["damak", "jhapa"], "Damak", "Jhapa"),
    (["hetauda", "makwanpur", "makawanpur"], "Hetauda", "Makwanpur"),
    (["nepalgunj", "kohalpur", "banke"], "Nepalgunj", "Banke"),
    (["dhangadhi", "tikapur", "kailali"], "Dhangadhi", "Kailali"),
    (["mahendranagar", "bhimdatta", "kanchanpur"], "Bhimdatta", "Kanchanpur"),
    (["birgunj", "birganj", "parsa"], "Birgunj", "Parsa"),
    (["janakpur", "dhanusha"], "Janakpur", "Dhanusha"),
    (["ghorahi", "tulsipur", "lamahi", "dang"], "", "Dang"),
    (["banepa", "dhulikhel", "kavre"], "Banepa", "Kavrepalanchok"),
    (["damauli", "tanahun", "tanahu"], "Damauli", "Tanahun"),
    (["baglung"], "Baglung", "Baglung"),
    (["kawasoti", "nawalparasi", "nawalpur"], "Kawasoti", "Nawalpur"),
    (["besisahar", "lamjung"], "Besisahar", "Lamjung"),
    (["gorkha"], "Gorkha", "Gorkha"),
    (["waling", "syangja"], "", "Syangja"),
    (["tansen", "palpa"], "Tansen", "Palpa"),
    (["birendranagar", "surkhet"], "Birendranagar", "Surkhet"),
    (["lahan", "siraha"], "Lahan", "Siraha"),
    (["rajbiraj", "saptari"], "Rajbiraj", "Saptari"),
    (["bhaktapur", "suryabinayak", "thimi"], "Bhaktapur", "Bhaktapur"),
    (["lalitpur", "kumaripati", "pulchowk", "jawalakhel", "lagankhel", "satdobato", "patan", "kupondole", "kupandole", "sanepa", "jhamsikhel", "gwarko", "imadol"], "Lalitpur", "Lalitpur"),
    (["kathmandu", "kathamandu", "kathamdu", "kathmadu", "ktm", "putalisadak", "putali sadak", "bagbazar", "bag bazar", "baghbazar", "bagh bazaar", "dillibazar", "dilli bazar", "baneshwor", "baneswor", "kamaladi", "thamel", "hattisar", "chabahil", "kalanki", "koteshwor", "maitidevi", "anamnagar", "sundhara", "lazimpat", "maharajgunj", "gongabu", "balaju", "kalimati", "tinkune", "sinamangal", "gaushala", "battisputali", "naxal", "kamalpokhari", "new plaza", "newplaza", "adwaitmarg", "ratopul", "ghattekulo", "bhotahity", "jamal", "kantipath", "durbarmarg", "tripureshwor", "teku", "kirtipur", "samakhusi", "basundhara", "boudha", "jorpati", "new road", "newroad", "shankar dev"], "Kathmandu", "Kathmandu"),
]


def guess_place(address):
    text = address.lower()
    for words, city, district in PLACES:
        if any(word in text for word in words):
            return city, district
    return "", ""


def main(pdf_path, csv_path):
    rows = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                for cells in table:
                    cells = [(cell or "").replace("\n", " ").strip() for cell in cells]
                    if len(cells) == 4 and cells[0].isdigit():
                        rows.append(cells)

    with open(csv_path, "w", newline="", encoding="utf-8") as out:
        writer = csv.writer(out, lineterminator="\n")
        # The first eight columns are what the import script reads. It ignores the rest.
        writer.writerow(["name", "registration_number", "address", "city", "district", "phone", "website", "countries",
                         "ministry_serial", "approval_date_as_printed", "check"])
        unmatched = 0
        for serial, name, address, approved in rows:
            name = re.sub(r"\s+", " ", name)
            address = re.sub(r"\s+", " ", address)
            city, district = guess_place(address)
            notes = []
            if re.search(r"[^\x00-\x7f]", name + address):
                # Devanagari text does not always come out of a PDF correctly.
                notes.append("non-Latin text: compare with the PDF")
            if not address:
                notes.append("no address in the PDF")
            elif not district:
                notes.append("city not recognised")
                unmatched += 1
            if len(name) > 70 or re.search(r"previous|old name|new name|changed", name, re.I):
                notes.append("long name or name change: tidy the name")
            writer.writerow([name, "", address, city, district, "", "", "", serial, approved, "; ".join(notes)])

    print(f"Wrote {len(rows)} rows to {csv_path}. City not recognised for {unmatched} rows.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
