"""Seed comprehensive mental health symptoms

Revision ID: xxx_seed_symptoms
Revises: d2a79ea3fd06
Create Date: 2025-10-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
import uuid

revision = 'xxx_seed_symptoms'
down_revision = 'combined_fix'
branch_labels = None
depends_on = None


def upgrade():
    # Source data: code/category are mapped into tags/categories respectively
    raw_data = [
        # 1. Mood & Affective
        {'code': 'F32', 'name': 'Major Depressive Episode', 'category': 'Mood & Affective', 'description': 'Low mood, anhedonia, neurovegetative changes'},
        {'code': 'F33', 'name': 'Recurrent Depressive Disorder', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Anhedonia (loss of pleasure)', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Low mood most of the day', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Diurnal mood variation', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Seasonal pattern of depression', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Psychomotor retardation', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Psychomotor agitation', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Feelings of worthlessness', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Excessive guilt', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Mood swings (lability)', 'category': 'Mood & Affective'},
        {'code': 'F31', 'name': 'Bipolar affective disorder—manic symptoms', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Elevated/expansive mood', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Irritable mood', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Decreased need for sleep', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Flight of ideas', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Increased goal-directed activity', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Emotional dysregulation', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Atypical features (mood reactivity)', 'category': 'Mood & Affective'},
        {'code': None, 'name': 'Mixed features (depression + hypomania)', 'category': 'Mood & Affective'},

        # 2. Anxiety & Fear-Based
        {'code': 'F41.1', 'name': 'Generalized Anxiety—excessive worry', 'category': 'Anxiety & Fear-Based'},
        {'code': None, 'name': 'Restlessness or feeling keyed up', 'category': 'Anxiety & Fear-Based'},
        {'code': None, 'name': 'Muscle tension', 'category': 'Anxiety & Fear-Based'},
        {'code': 'F41.0', 'name': 'Panic attacks', 'category': 'Anxiety & Fear-Based'},
        {'code': None, 'name': 'Anticipatory anxiety', 'category': 'Anxiety & Fear-Based'},
        {'code': None, 'name': 'Health anxiety (illness anxiety)', 'category': 'Anxiety & Fear-Based'},
        {'code': 'F40', 'name': 'Specific phobia (situational/object)', 'category': 'Anxiety & Fear-Based'},
        {'code': None, 'name': 'Social anxiety (performance fears)', 'category': 'Anxiety & Fear-Based'},
        {'code': None, 'name': 'Obsessions (intrusive thoughts)', 'category': 'Anxiety & Fear-Based'},
        {'code': None, 'name': 'Compulsions (rituals, checking)', 'category': 'Anxiety & Fear-Based'},
        {'code': None, 'name': 'Avoidance behaviors', 'category': 'Anxiety & Fear-Based'},
        {'code': None, 'name': 'Shortness of breath with anxiety', 'category': 'Anxiety & Fear-Based'},
        {'code': None, 'name': 'Chest tightness with anxiety', 'category': 'Anxiety & Fear-Based'},
        {'code': None, 'name': 'Startle response exaggerated', 'category': 'Anxiety & Fear-Based'},
        {'code': None, 'name': 'Safety behaviors (reassurance seeking)', 'category': 'Anxiety & Fear-Based'},

        # 3. Trauma & Stress-Related
        {'code': 'F43.1', 'name': 'Post-Traumatic Stress symptoms', 'category': 'Trauma & Stress-Related'},
        {'code': None, 'name': 'Intrusive memories/flashbacks', 'category': 'Trauma & Stress-Related'},
        {'code': None, 'name': 'Nightmares related to trauma', 'category': 'Trauma & Stress-Related'},
        {'code': None, 'name': 'Avoidance of reminders', 'category': 'Trauma & Stress-Related'},
        {'code': None, 'name': 'Emotional numbing', 'category': 'Trauma & Stress-Related'},
        {'code': None, 'name': 'Hyperarousal (hypervigilance)', 'category': 'Trauma & Stress-Related'},
        {'code': None, 'name': 'Dissociation/depersonalization', 'category': 'Trauma & Stress-Related'},
        {'code': None, 'name': 'Negative self-beliefs post-trauma', 'category': 'Trauma & Stress-Related'},
        {'code': None, 'name': 'Acute stress reaction', 'category': 'Trauma & Stress-Related'},
        {'code': None, 'name': 'Guilt/shame related to trauma', 'category': 'Trauma & Stress-Related'},

        # 4. Psychotic & Thought Disorders
        {'code': '6A20', 'name': 'Schizophrenia spectrum symptoms', 'category': 'Psychotic & Thought'},
        {'code': None, 'name': 'Auditory hallucinations', 'category': 'Psychotic & Thought'},
        {'code': None, 'name': 'Visual hallucinations', 'category': 'Psychotic & Thought'},
        {'code': None, 'name': 'Tactile/olfactory hallucinations', 'category': 'Psychotic & Thought'},
        {'code': None, 'name': 'Paranoid delusions', 'category': 'Psychotic & Thought'},
        {'code': None, 'name': 'Grandiose delusions', 'category': 'Psychotic & Thought'},
        {'code': None, 'name': 'Thought insertion/withdrawal', 'category': 'Psychotic & Thought'},
        {'code': None, 'name': 'Disorganized speech', 'category': 'Psychotic & Thought'},
        {'code': None, 'name': 'Catatonia (stupor, posturing)', 'category': 'Psychotic & Thought'},
        {'code': None, 'name': 'Negative symptoms (avolition, alogia)', 'category': 'Psychotic & Thought'},

        # 5. Personality & Interpersonal
        {'code': None, 'name': 'Identity disturbance', 'category': 'Personality & Interpersonal'},
        {'code': None, 'name': 'Fear of abandonment', 'category': 'Personality & Interpersonal'},
        {'code': None, 'name': 'Splitting (idealization/devaluation)', 'category': 'Personality & Interpersonal'},
        {'code': None, 'name': 'Impulsivity (risk behaviors)', 'category': 'Personality & Interpersonal'},
        {'code': None, 'name': 'Chronic emptiness', 'category': 'Personality & Interpersonal'},
        {'code': None, 'name': 'Interpersonal conflicts', 'category': 'Personality & Interpersonal'},
        {'code': None, 'name': 'Rigid perfectionism', 'category': 'Personality & Interpersonal'},
        {'code': None, 'name': 'Suspiciousness/paranoia', 'category': 'Personality & Interpersonal'},

        # 6. Substance & Addiction
        {'code': None, 'name': 'Cravings (substances/behaviors)', 'category': 'Substance & Addiction'},
        {'code': None, 'name': 'Tolerance (needs more)', 'category': 'Substance & Addiction'},
        {'code': None, 'name': 'Withdrawal symptoms', 'category': 'Substance & Addiction'},
        {'code': None, 'name': 'Loss of control over use', 'category': 'Substance & Addiction'},
        {'code': None, 'name': 'Gambling urges', 'category': 'Substance & Addiction'},
        {'code': None, 'name': 'Internet/gaming overuse', 'category': 'Substance & Addiction'},

        # 7. Eating & Body Image
        {'code': 'F50', 'name': 'Restrictive eating', 'category': 'Eating & Body Image'},
        {'code': None, 'name': 'Binge eating episodes', 'category': 'Eating & Body Image'},
        {'code': None, 'name': 'Compensatory behaviors (purging/overexercise)', 'category': 'Eating & Body Image'},
        {'code': None, 'name': 'Body image distortion', 'category': 'Eating & Body Image'},
        {'code': None, 'name': 'Food preoccupation', 'category': 'Eating & Body Image'},

        # 8. Sleep & Circadian
        {'code': 'F51.0', 'name': 'Insomnia—initial (sleep onset)', 'category': 'Sleep & Circadian'},
        {'code': None, 'name': 'Insomnia—middle (maintenance)', 'category': 'Sleep & Circadian'},
        {'code': None, 'name': 'Early morning awakening', 'category': 'Sleep & Circadian'},
        {'code': 'F51.1', 'name': 'Hypersomnia (excessive sleep)', 'category': 'Sleep & Circadian'},
        {'code': None, 'name': 'Nightmares', 'category': 'Sleep & Circadian'},
        {'code': None, 'name': 'Sleep paralysis', 'category': 'Sleep & Circadian'},
        {'code': None, 'name': 'Circadian rhythm disruption', 'category': 'Sleep & Circadian'},

        # 9. Cognitive & Executive Function
        {'code': None, 'name': 'Memory problems', 'category': 'Cognitive & Executive'},
        {'code': None, 'name': 'Attention deficits', 'category': 'Cognitive & Executive'},
        {'code': None, 'name': 'Executive dysfunction', 'category': 'Cognitive & Executive'},
        {'code': None, 'name': 'Slowed processing speed', 'category': 'Cognitive & Executive'},
        {'code': None, 'name': 'Confusion/disorientation', 'category': 'Cognitive & Executive'},
        {'code': None, 'name': 'Poor planning/organization', 'category': 'Cognitive & Executive'},
        {'code': None, 'name': 'Indecisiveness', 'category': 'Cognitive & Executive'},

        # 10. Somatic & Physical
        {'code': None, 'name': 'Fatigue (low energy)', 'category': 'Somatic & Physical'},
        {'code': None, 'name': 'Appetite changes', 'category': 'Somatic & Physical'},
        {'code': None, 'name': 'Weight changes', 'category': 'Somatic & Physical'},
        {'code': None, 'name': 'Pain without clear medical cause', 'category': 'Somatic & Physical'},
        {'code': None, 'name': 'Muscle tension', 'category': 'Somatic & Physical'},
        {'code': None, 'name': 'Gastrointestinal distress (stress-related)', 'category': 'Somatic & Physical'},

        # 11. Behavioral & Functional
        {'code': None, 'name': 'Self-harm behaviors', 'category': 'Behavioral & Functional'},
        {'code': None, 'name': 'Suicidal ideation', 'category': 'Behavioral & Functional'},
        {'code': None, 'name': 'Aggression/irritability', 'category': 'Behavioral & Functional'},
        {'code': None, 'name': 'Compulsive rituals', 'category': 'Behavioral & Functional'},
        {'code': None, 'name': 'Social withdrawal', 'category': 'Behavioral & Functional'},
        {'code': None, 'name': 'Functional impairment at work/school', 'category': 'Behavioral & Functional'},

        # 12. Developmental & Child-Specific
        {'code': None, 'name': 'Separation anxiety (child)', 'category': 'Developmental & Child'},
        {'code': None, 'name': 'Attachment difficulties', 'category': 'Developmental & Child'},
        {'code': None, 'name': 'Regression under stress', 'category': 'Developmental & Child'},
        {'code': None, 'name': 'Developmental delay concerns', 'category': 'Developmental & Child'},

        # 13. Neurodevelopmental
        {'code': '6A05', 'name': 'ADHD—attention difficulties', 'category': 'Neurodevelopmental'},
        {'code': None, 'name': 'ADHD—hyperactivity/impulsivity', 'category': 'Neurodevelopmental'},
        {'code': '6A02', 'name': 'Autism spectrum indicators', 'category': 'Neurodevelopmental'},
        {'code': None, 'name': 'Tics/stereotypies', 'category': 'Neurodevelopmental'},
    ]

    # Expand with additional variants to reach ~170 entries
    # (Add commonly used clinical descriptors for searchability)
    variants = [
        ('Mood & Affective', [
            'Hopelessness about future', 'Frequent crying spells', 'Reduced libido', 'Apathy'], None),
        ('Anxiety & Fear-Based', [
            'Racing thoughts', 'Mind going blank', 'Fear of losing control', 'Compulsive reassurance seeking'], None),
        ('Sleep & Circadian', [
            'Irregular sleep-wake schedule', 'Non-restorative sleep'], 'F51'),
        ('Cognitive & Executive', [
            'Difficulty multitasking', 'Easily distracted by stimuli', 'Poor working memory'], None),
        ('Behavioral & Functional', [
            'Avoidance of social situations', 'Ritualized behaviors interfering with life'], None),
    ]

    for category, names, code in variants:
        for n in names:
            raw_data.append({'code': code, 'name': n, 'category': category})

    # Transform to master_symptoms schema with de-duplication on name
    aggregated = {}
    for item in raw_data:
        name = item.get('name')
        if not name:
            continue
        key = name.strip().lower()
        category = item.get('category')
        description = (item.get('description') or '').strip()
        code = item.get('code')

        if key not in aggregated:
            aggregated[key] = {
                'name': name.strip(),
                'description': description,  # may be empty string
                'categories': set([category]) if category else set(),
                'tags': set([code]) if code else set(),
            }
        else:
            # Merge categories and tags, prefer first non-empty description
            if category:
                aggregated[key]['categories'].add(category)
            if code:
                aggregated[key]['tags'].add(code)
            if not aggregated[key]['description'] and description:
                aggregated[key]['description'] = description

    to_insert = []
    for entry in aggregated.values():
        to_insert.append({
            'id': str(uuid.uuid4()),
            'name': entry['name'],
            'description': entry['description'] or '',
            'categories': sorted(list(entry['categories'])),
            'aliases': [],
            'tags': sorted(list(entry['tags'])),
            'is_active': 1,
        })

    # Insert into master_symptoms
    master_symptoms = sa.table(
        'master_symptoms',
        sa.column('id', sa.String),
        sa.column('name', sa.String),
        sa.column('description', sa.Text),
        sa.column('categories', JSONB),
        sa.column('aliases', JSONB),
        sa.column('tags', JSONB),
        sa.column('is_active', sa.Integer),
    )
    if to_insert:
        op.bulk_insert(master_symptoms, to_insert)


def downgrade():
    op.execute("DELETE FROM master_symptoms")


