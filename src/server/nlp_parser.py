# server/nlp_parser.py
import spacy
import ginza

nlp = spacy.load('ja_ginza')

def parse_japanese_doc(text):
    doc = nlp(text)
    requirements = []
    for sent in doc.sents:
        if '要件' in sent.text:
            requirements.append({
                'text': sent.text,
                'verbs': [token.lemma_ for token in sent if token.pos_ == 'VERB']
            })
    return requirements
