"""seed_comprehensive_mental_health_symptoms

Revision ID: b28dea2a0f9f
Revises: 
Create Date: 2025-10-06 00:08:48.621508

This migration seeds the master_symptoms table with a comprehensive
library of 196+ mental health symptoms for clinical documentation.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import JSONB
import uuid


# revision identifiers, used by Alembic.
revision: str = 'b28dea2a0f9f'
down_revision: Union[str, None] = 'doctor_reg_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed comprehensive mental health symptoms library."""
    
    # Raw symptom data with code, name, category, and description
    symptoms_data = [
        # ============================================================
        # 1. Mood & Affective (20 symptoms)
        # ============================================================
        {'code': 'F32', 'name': 'Major Depressive Episode', 'category': 'Mood & Affective', 'description': 'Low mood, anhedonia, neurovegetative changes'},
        {'code': 'F33', 'name': 'Recurrent Depressive Disorder', 'category': 'Mood & Affective', 'description': 'Pattern of repeated depressive episodes'},
        {'code': None, 'name': 'Anhedonia (loss of pleasure)', 'category': 'Mood & Affective', 'description': 'Inability to feel pleasure in normally enjoyable activities'},
        {'code': None, 'name': 'Low mood most of the day', 'category': 'Mood & Affective', 'description': 'Persistent depressed mood throughout the day'},
        {'code': None, 'name': 'Diurnal mood variation', 'category': 'Mood & Affective', 'description': 'Mood changes at different times of day'},
        {'code': None, 'name': 'Seasonal pattern of depression', 'category': 'Mood & Affective', 'description': 'Depression occurring at specific seasons'},
        {'code': None, 'name': 'Psychomotor retardation', 'category': 'Mood & Affective', 'description': 'Slowed movements and speech'},
        {'code': None, 'name': 'Psychomotor agitation', 'category': 'Mood & Affective', 'description': 'Excessive motor activity, restlessness'},
        {'code': None, 'name': 'Feelings of worthlessness', 'category': 'Mood & Affective', 'description': 'Persistent negative self-evaluation'},
        {'code': None, 'name': 'Excessive guilt', 'category': 'Mood & Affective', 'description': 'Inappropriate or exaggerated guilt feelings'},
        {'code': None, 'name': 'Mood swings (lability)', 'category': 'Mood & Affective', 'description': 'Rapid and extreme changes in emotional state'},
        {'code': 'F31', 'name': 'Bipolar affective disorder—manic symptoms', 'category': 'Mood & Affective', 'description': 'Elevated mood with increased energy'},
        {'code': None, 'name': 'Elevated/expansive mood', 'category': 'Mood & Affective', 'description': 'Abnormally elevated or euphoric mood'},
        {'code': None, 'name': 'Irritable mood', 'category': 'Mood & Affective', 'description': 'Easily annoyed or angered'},
        {'code': None, 'name': 'Decreased need for sleep', 'category': 'Mood & Affective', 'description': 'Feeling rested after very little sleep'},
        {'code': None, 'name': 'Flight of ideas', 'category': 'Mood & Affective', 'description': 'Racing thoughts, rapid topic changes'},
        {'code': None, 'name': 'Increased goal-directed activity', 'category': 'Mood & Affective', 'description': 'Surge in purposeful activities'},
        {'code': None, 'name': 'Emotional dysregulation', 'category': 'Mood & Affective', 'description': 'Difficulty managing emotional responses'},
        {'code': None, 'name': 'Atypical features (mood reactivity)', 'category': 'Mood & Affective', 'description': 'Mood brightens with positive events'},
        {'code': None, 'name': 'Mixed features (depression + hypomania)', 'category': 'Mood & Affective', 'description': 'Simultaneous depressive and manic symptoms'},

        # ============================================================
        # 2. Anxiety & Fear-Based (20 symptoms)
        # ============================================================
        {'code': 'F41.1', 'name': 'Generalized Anxiety—excessive worry', 'category': 'Anxiety & Fear-Based', 'description': 'Persistent, excessive worry about multiple concerns'},
        {'code': None, 'name': 'Restlessness or feeling keyed up', 'category': 'Anxiety & Fear-Based', 'description': 'Feeling on edge or unable to relax'},
        {'code': None, 'name': 'Muscle tension', 'category': 'Anxiety & Fear-Based', 'description': 'Physical tension in muscles, often in neck/shoulders'},
        {'code': 'F41.0', 'name': 'Panic attacks', 'category': 'Anxiety & Fear-Based', 'description': 'Sudden episodes of intense fear with physical symptoms'},
        {'code': None, 'name': 'Anticipatory anxiety', 'category': 'Anxiety & Fear-Based', 'description': 'Anxiety about future events or situations'},
        {'code': None, 'name': 'Health anxiety (illness anxiety)', 'category': 'Anxiety & Fear-Based', 'description': 'Excessive worry about having serious illness'},
        {'code': 'F40', 'name': 'Specific phobia (situational/object)', 'category': 'Anxiety & Fear-Based', 'description': 'Intense fear of specific objects or situations'},
        {'code': 'F40.1', 'name': 'Social anxiety (performance fears)', 'category': 'Anxiety & Fear-Based', 'description': 'Fear of social situations or performance'},
        {'code': 'F42', 'name': 'Obsessions (intrusive thoughts)', 'category': 'Anxiety & Fear-Based', 'description': 'Unwanted, repetitive thoughts or urges'},
        {'code': None, 'name': 'Compulsions (rituals, checking)', 'category': 'Anxiety & Fear-Based', 'description': 'Repetitive behaviors to reduce anxiety'},
        {'code': None, 'name': 'Avoidance behaviors', 'category': 'Anxiety & Fear-Based', 'description': 'Avoiding situations that trigger anxiety'},
        {'code': None, 'name': 'Shortness of breath with anxiety', 'category': 'Anxiety & Fear-Based', 'description': 'Difficulty breathing during anxious episodes'},
        {'code': None, 'name': 'Chest tightness with anxiety', 'category': 'Anxiety & Fear-Based', 'description': 'Feeling of pressure or pain in chest'},
        {'code': None, 'name': 'Startle response exaggerated', 'category': 'Anxiety & Fear-Based', 'description': 'Heightened reaction to sudden stimuli'},
        {'code': None, 'name': 'Safety behaviors (reassurance seeking)', 'category': 'Anxiety & Fear-Based', 'description': 'Behaviors to feel safe or reduce fear'},
        {'code': None, 'name': 'Derealization', 'category': 'Anxiety & Fear-Based', 'description': 'Feeling that surroundings are unreal'},
        {'code': None, 'name': 'Depersonalization', 'category': 'Anxiety & Fear-Based', 'description': 'Feeling detached from oneself'},
        {'code': None, 'name': 'Fear of losing control', 'category': 'Anxiety & Fear-Based', 'description': 'Worry about losing control of actions or emotions'},
        {'code': None, 'name': 'Agoraphobia (fear of open spaces)', 'category': 'Anxiety & Fear-Based', 'description': 'Fear of situations where escape might be difficult'},
        {'code': None, 'name': 'Perfectionism-driven anxiety', 'category': 'Anxiety & Fear-Based', 'description': 'Anxiety related to unrealistic standards'},

        # ============================================================
        # 3. Trauma & Stress-Related (15 symptoms)
        # ============================================================
        {'code': 'F43.1', 'name': 'Post-Traumatic Stress symptoms', 'category': 'Trauma & Stress-Related', 'description': 'Persistent symptoms following traumatic event'},
        {'code': None, 'name': 'Intrusive memories/flashbacks', 'category': 'Trauma & Stress-Related', 'description': 'Unwanted memories of traumatic event'},
        {'code': None, 'name': 'Nightmares related to trauma', 'category': 'Trauma & Stress-Related', 'description': 'Disturbing dreams about traumatic experience'},
        {'code': None, 'name': 'Avoidance of reminders', 'category': 'Trauma & Stress-Related', 'description': 'Avoiding thoughts, feelings, or situations related to trauma'},
        {'code': None, 'name': 'Emotional numbing', 'category': 'Trauma & Stress-Related', 'description': 'Reduced emotional responsiveness'},
        {'code': None, 'name': 'Hyperarousal (hypervigilance)', 'category': 'Trauma & Stress-Related', 'description': 'Increased alertness and scanning for threats'},
        {'code': None, 'name': 'Dissociation/depersonalization', 'category': 'Trauma & Stress-Related', 'description': 'Feeling disconnected from body or reality'},
        {'code': None, 'name': 'Negative self-beliefs post-trauma', 'category': 'Trauma & Stress-Related', 'description': 'Persistent negative beliefs about oneself after trauma'},
        {'code': 'F43.0', 'name': 'Acute stress reaction', 'category': 'Trauma & Stress-Related', 'description': 'Immediate response to severe stress'},
        {'code': None, 'name': 'Guilt/shame related to trauma', 'category': 'Trauma & Stress-Related', 'description': 'Feelings of guilt or shame about traumatic event'},
        {'code': None, 'name': 'Survivor guilt', 'category': 'Trauma & Stress-Related', 'description': 'Guilt about surviving when others did not'},
        {'code': None, 'name': 'Trauma-related anger outbursts', 'category': 'Trauma & Stress-Related', 'description': 'Intense anger episodes related to trauma'},
        {'code': None, 'name': 'Re-experiencing symptoms', 'category': 'Trauma & Stress-Related', 'description': 'Reliving the traumatic event'},
        {'code': None, 'name': 'Negative alterations in cognition', 'category': 'Trauma & Stress-Related', 'description': 'Persistent negative thoughts after trauma'},
        {'code': None, 'name': 'Detachment from others post-trauma', 'category': 'Trauma & Stress-Related', 'description': 'Feeling disconnected from other people'},

        # ============================================================
        # 4. Psychotic & Thought Disorders (18 symptoms)
        # ============================================================
        {'code': '6A20', 'name': 'Schizophrenia spectrum symptoms', 'category': 'Psychotic & Thought', 'description': 'Core symptoms of schizophrenia'},
        {'code': None, 'name': 'Auditory hallucinations', 'category': 'Psychotic & Thought', 'description': 'Hearing voices or sounds not present'},
        {'code': None, 'name': 'Visual hallucinations', 'category': 'Psychotic & Thought', 'description': 'Seeing things not present'},
        {'code': None, 'name': 'Tactile/olfactory hallucinations', 'category': 'Psychotic & Thought', 'description': 'Feeling or smelling things not present'},
        {'code': None, 'name': 'Paranoid delusions', 'category': 'Psychotic & Thought', 'description': 'False beliefs of persecution or conspiracy'},
        {'code': None, 'name': 'Grandiose delusions', 'category': 'Psychotic & Thought', 'description': 'False beliefs of special powers or importance'},
        {'code': None, 'name': 'Thought insertion/withdrawal', 'category': 'Psychotic & Thought', 'description': 'Belief that thoughts are inserted or removed'},
        {'code': None, 'name': 'Disorganized speech', 'category': 'Psychotic & Thought', 'description': 'Incoherent or tangential speech patterns'},
        {'code': None, 'name': 'Catatonia (stupor, posturing)', 'category': 'Psychotic & Thought', 'description': 'Abnormal motor behavior or immobility'},
        {'code': None, 'name': 'Negative symptoms (avolition, alogia)', 'category': 'Psychotic & Thought', 'description': 'Reduced motivation, speech, or emotional expression'},
        {'code': None, 'name': 'Thought broadcasting', 'category': 'Psychotic & Thought', 'description': 'Belief that thoughts are audible to others'},
        {'code': None, 'name': 'Referential delusions', 'category': 'Psychotic & Thought', 'description': 'Belief that events have special personal meaning'},
        {'code': None, 'name': 'Command hallucinations', 'category': 'Psychotic & Thought', 'description': 'Voices telling person to do things'},
        {'code': None, 'name': 'Bizarre behavior', 'category': 'Psychotic & Thought', 'description': 'Unusual or inappropriate behavior'},
        {'code': None, 'name': 'Flat affect', 'category': 'Psychotic & Thought', 'description': 'Lack of emotional expression'},
        {'code': None, 'name': 'Poverty of speech', 'category': 'Psychotic & Thought', 'description': 'Very limited verbal output'},
        {'code': None, 'name': 'Social withdrawal (psychotic)', 'category': 'Psychotic & Thought', 'description': 'Isolation due to psychotic symptoms'},
        {'code': None, 'name': 'Loosening of associations', 'category': 'Psychotic & Thought', 'description': 'Disjointed thought connections'},

        # ============================================================
        # 5. Personality & Interpersonal (15 symptoms)
        # ============================================================
        {'code': None, 'name': 'Identity disturbance', 'category': 'Personality & Interpersonal', 'description': 'Unstable sense of self'},
        {'code': None, 'name': 'Fear of abandonment', 'category': 'Personality & Interpersonal', 'description': 'Intense fear of being left alone'},
        {'code': None, 'name': 'Splitting (idealization/devaluation)', 'category': 'Personality & Interpersonal', 'description': 'Viewing people as all good or all bad'},
        {'code': None, 'name': 'Impulsivity (risk behaviors)', 'category': 'Personality & Interpersonal', 'description': 'Acting without thinking about consequences'},
        {'code': None, 'name': 'Chronic emptiness', 'category': 'Personality & Interpersonal', 'description': 'Persistent feeling of inner void'},
        {'code': None, 'name': 'Interpersonal conflicts', 'category': 'Personality & Interpersonal', 'description': 'Frequent relationship difficulties'},
        {'code': None, 'name': 'Rigid perfectionism', 'category': 'Personality & Interpersonal', 'description': 'Inflexible standards for self and others'},
        {'code': None, 'name': 'Suspiciousness/paranoia (personality)', 'category': 'Personality & Interpersonal', 'description': 'Persistent distrust of others'},
        {'code': None, 'name': 'Emotional instability', 'category': 'Personality & Interpersonal', 'description': 'Rapidly changing emotions'},
        {'code': None, 'name': 'Unstable relationships', 'category': 'Personality & Interpersonal', 'description': 'Pattern of intense, unstable relationships'},
        {'code': None, 'name': 'Narcissistic traits', 'category': 'Personality & Interpersonal', 'description': 'Excessive self-focus and need for admiration'},
        {'code': None, 'name': 'Submissiveness/dependency', 'category': 'Personality & Interpersonal', 'description': 'Excessive need for others to make decisions'},
        {'code': None, 'name': 'Detachment (schizoid traits)', 'category': 'Personality & Interpersonal', 'description': 'Limited interest in social relationships'},
        {'code': None, 'name': 'Attention-seeking behaviors', 'category': 'Personality & Interpersonal', 'description': 'Excessive need to be noticed'},
        {'code': None, 'name': 'Difficulty trusting others', 'category': 'Personality & Interpersonal', 'description': 'Persistent mistrust in relationships'},

        # ============================================================
        # 6. Substance & Addiction (12 symptoms)
        # ============================================================
        {'code': 'F10-F19', 'name': 'Substance use disorder symptoms', 'category': 'Substance & Addiction', 'description': 'Pattern of problematic substance use'},
        {'code': None, 'name': 'Cravings (substances/behaviors)', 'category': 'Substance & Addiction', 'description': 'Intense urges to use substance or engage in behavior'},
        {'code': None, 'name': 'Tolerance (needs more)', 'category': 'Substance & Addiction', 'description': 'Need for increased amounts to achieve effect'},
        {'code': None, 'name': 'Withdrawal symptoms', 'category': 'Substance & Addiction', 'description': 'Physical/psychological symptoms when substance stopped'},
        {'code': None, 'name': 'Loss of control over use', 'category': 'Substance & Addiction', 'description': 'Unable to limit substance use'},
        {'code': None, 'name': 'Continued use despite harm', 'category': 'Substance & Addiction', 'description': 'Using despite negative consequences'},
        {'code': None, 'name': 'Neglecting responsibilities', 'category': 'Substance & Addiction', 'description': 'Failing obligations due to use'},
        {'code': None, 'name': 'Gambling urges', 'category': 'Substance & Addiction', 'description': 'Compulsive need to gamble'},
        {'code': None, 'name': 'Internet/gaming overuse', 'category': 'Substance & Addiction', 'description': 'Excessive use interfering with life'},
        {'code': None, 'name': 'Preoccupation with substance/behavior', 'category': 'Substance & Addiction', 'description': 'Constant thoughts about using'},
        {'code': None, 'name': 'Failed attempts to quit', 'category': 'Substance & Addiction', 'description': 'Repeated unsuccessful efforts to stop'},
        {'code': None, 'name': 'Social/occupational impairment from use', 'category': 'Substance & Addiction', 'description': 'Life functioning affected by use'},

        # ============================================================
        # 7. Eating & Body Image (12 symptoms)
        # ============================================================
        {'code': 'F50', 'name': 'Eating disorder symptoms', 'category': 'Eating & Body Image', 'description': 'Disordered eating patterns'},
        {'code': None, 'name': 'Restrictive eating', 'category': 'Eating & Body Image', 'description': 'Severely limiting food intake'},
        {'code': None, 'name': 'Binge eating episodes', 'category': 'Eating & Body Image', 'description': 'Eating large amounts in short time with loss of control'},
        {'code': None, 'name': 'Compensatory behaviors (purging/overexercise)', 'category': 'Eating & Body Image', 'description': 'Behaviors to prevent weight gain'},
        {'code': None, 'name': 'Body image distortion', 'category': 'Eating & Body Image', 'description': 'Inaccurate perception of body size/shape'},
        {'code': None, 'name': 'Food preoccupation', 'category': 'Eating & Body Image', 'description': 'Constant thoughts about food, eating, weight'},
        {'code': None, 'name': 'Fear of weight gain', 'category': 'Eating & Body Image', 'description': 'Intense anxiety about gaining weight'},
        {'code': None, 'name': 'Self-induced vomiting', 'category': 'Eating & Body Image', 'description': 'Purposeful vomiting after eating'},
        {'code': None, 'name': 'Laxative/diuretic misuse', 'category': 'Eating & Body Image', 'description': 'Using medications to lose weight'},
        {'code': None, 'name': 'Emotional eating', 'category': 'Eating & Body Image', 'description': 'Eating in response to emotions'},
        {'code': None, 'name': 'Guilt after eating', 'category': 'Eating & Body Image', 'description': 'Feeling guilty about food consumption'},
        {'code': None, 'name': 'Distorted body perception', 'category': 'Eating & Body Image', 'description': 'Seeing body differently than reality'},

        # ============================================================
        # 8. Sleep & Circadian (12 symptoms)
        # ============================================================
        {'code': 'F51.0', 'name': 'Insomnia—initial (sleep onset)', 'category': 'Sleep & Circadian', 'description': 'Difficulty falling asleep'},
        {'code': None, 'name': 'Insomnia—middle (maintenance)', 'category': 'Sleep & Circadian', 'description': 'Waking during night, difficulty returning to sleep'},
        {'code': None, 'name': 'Early morning awakening', 'category': 'Sleep & Circadian', 'description': 'Waking too early, unable to return to sleep'},
        {'code': 'F51.1', 'name': 'Hypersomnia (excessive sleep)', 'category': 'Sleep & Circadian', 'description': 'Sleeping excessively, difficulty staying awake'},
        {'code': None, 'name': 'Nightmares (frequent)', 'category': 'Sleep & Circadian', 'description': 'Disturbing dreams causing distress'},
        {'code': None, 'name': 'Sleep paralysis', 'category': 'Sleep & Circadian', 'description': 'Unable to move when falling asleep or waking'},
        {'code': None, 'name': 'Circadian rhythm disruption', 'category': 'Sleep & Circadian', 'description': 'Sleep-wake cycle out of sync'},
        {'code': None, 'name': 'Non-restorative sleep', 'category': 'Sleep & Circadian', 'description': 'Not feeling rested despite sleeping'},
        {'code': None, 'name': 'Sleep terrors', 'category': 'Sleep & Circadian', 'description': 'Episodes of intense fear during sleep'},
        {'code': None, 'name': 'Sleepwalking', 'category': 'Sleep & Circadian', 'description': 'Walking or performing activities while asleep'},
        {'code': None, 'name': 'Irregular sleep schedule', 'category': 'Sleep & Circadian', 'description': 'Inconsistent sleep-wake times'},
        {'code': None, 'name': 'Daytime sleepiness', 'category': 'Sleep & Circadian', 'description': 'Excessive tiredness during day'},

        # ============================================================
        # 9. Cognitive & Executive Function (18 symptoms)
        # ============================================================
        {'code': None, 'name': 'Memory problems (short-term)', 'category': 'Cognitive & Executive', 'description': 'Difficulty remembering recent events'},
        {'code': None, 'name': 'Memory problems (long-term)', 'category': 'Cognitive & Executive', 'description': 'Difficulty recalling past information'},
        {'code': None, 'name': 'Attention deficits', 'category': 'Cognitive & Executive', 'description': 'Difficulty sustaining focus'},
        {'code': None, 'name': 'Executive dysfunction', 'category': 'Cognitive & Executive', 'description': 'Problems with planning, organizing, decision-making'},
        {'code': None, 'name': 'Slowed processing speed', 'category': 'Cognitive & Executive', 'description': 'Taking longer to process information'},
        {'code': None, 'name': 'Confusion/disorientation', 'category': 'Cognitive & Executive', 'description': 'Unclear about time, place, or situation'},
        {'code': None, 'name': 'Poor planning/organization', 'category': 'Cognitive & Executive', 'description': 'Difficulty structuring tasks'},
        {'code': None, 'name': 'Indecisiveness', 'category': 'Cognitive & Executive', 'description': 'Difficulty making decisions'},
        {'code': None, 'name': 'Concentration difficulties', 'category': 'Cognitive & Executive', 'description': 'Unable to maintain mental focus'},
        {'code': None, 'name': 'Cognitive rigidity', 'category': 'Cognitive & Executive', 'description': 'Difficulty adapting thinking'},
        {'code': None, 'name': 'Working memory deficits', 'category': 'Cognitive & Executive', 'description': 'Difficulty holding information temporarily'},
        {'code': None, 'name': 'Impaired judgment', 'category': 'Cognitive & Executive', 'description': 'Poor decision-making ability'},
        {'code': None, 'name': 'Mental fog/clouding', 'category': 'Cognitive & Executive', 'description': 'Feeling mentally unclear'},
        {'code': None, 'name': 'Difficulty with abstract thinking', 'category': 'Cognitive & Executive', 'description': 'Trouble with conceptual ideas'},
        {'code': None, 'name': 'Verbal fluency problems', 'category': 'Cognitive & Executive', 'description': 'Difficulty finding words'},
        {'code': None, 'name': 'Task-switching difficulties', 'category': 'Cognitive & Executive', 'description': 'Trouble shifting between activities'},
        {'code': None, 'name': 'Rumination (repetitive thinking)', 'category': 'Cognitive & Executive', 'description': 'Dwelling on negative thoughts'},
        {'code': None, 'name': 'Racing thoughts', 'category': 'Cognitive & Executive', 'description': 'Rapid, uncontrollable thought flow'},

        # ============================================================
        # 10. Somatic & Physical (12 symptoms)
        # ============================================================
        {'code': None, 'name': 'Fatigue (low energy)', 'category': 'Somatic & Physical', 'description': 'Persistent tiredness or exhaustion'},
        {'code': None, 'name': 'Appetite changes (increased)', 'category': 'Somatic & Physical', 'description': 'Eating more than usual'},
        {'code': None, 'name': 'Appetite changes (decreased)', 'category': 'Somatic & Physical', 'description': 'Eating less than usual'},
        {'code': None, 'name': 'Weight gain (unintentional)', 'category': 'Somatic & Physical', 'description': 'Gaining weight without trying'},
        {'code': None, 'name': 'Weight loss (unintentional)', 'category': 'Somatic & Physical', 'description': 'Losing weight without trying'},
        {'code': None, 'name': 'Chronic pain without medical cause', 'category': 'Somatic & Physical', 'description': 'Persistent pain without clear physical origin'},
        {'code': None, 'name': 'Headaches (tension/stress-related)', 'category': 'Somatic & Physical', 'description': 'Frequent headaches related to stress'},
        {'code': None, 'name': 'Gastrointestinal distress (stress-related)', 'category': 'Somatic & Physical', 'description': 'Stomach problems linked to psychological factors'},
        {'code': None, 'name': 'Dizziness/lightheadedness', 'category': 'Somatic & Physical', 'description': 'Feeling faint or unsteady'},
        {'code': None, 'name': 'Heart palpitations', 'category': 'Somatic & Physical', 'description': 'Awareness of rapid or irregular heartbeat'},
        {'code': None, 'name': 'Sweating (excessive)', 'category': 'Somatic & Physical', 'description': 'Perspiring more than normal'},
        {'code': None, 'name': 'Trembling/shaking', 'category': 'Somatic & Physical', 'description': 'Involuntary shaking of body parts'},

        # ============================================================
        # 11. Behavioral & Functional (15 symptoms)
        # ============================================================
        {'code': None, 'name': 'Self-harm behaviors', 'category': 'Behavioral & Functional', 'description': 'Intentional injury to oneself'},
        {'code': None, 'name': 'Suicidal ideation', 'category': 'Behavioral & Functional', 'description': 'Thoughts of ending one\'s life'},
        {'code': None, 'name': 'Suicidal planning', 'category': 'Behavioral & Functional', 'description': 'Making plans to end one\'s life'},
        {'code': None, 'name': 'Aggression/irritability (behavioral)', 'category': 'Behavioral & Functional', 'description': 'Acting out with anger or hostility'},
        {'code': None, 'name': 'Compulsive rituals', 'category': 'Behavioral & Functional', 'description': 'Repetitive behaviors performed to reduce anxiety'},
        {'code': None, 'name': 'Social withdrawal (behavioral)', 'category': 'Behavioral & Functional', 'description': 'Avoiding social contact'},
        {'code': None, 'name': 'Functional impairment at work/school', 'category': 'Behavioral & Functional', 'description': 'Reduced performance in daily activities'},
        {'code': None, 'name': 'Procrastination (severe)', 'category': 'Behavioral & Functional', 'description': 'Persistent delay of important tasks'},
        {'code': None, 'name': 'Hoarding behaviors', 'category': 'Behavioral & Functional', 'description': 'Difficulty discarding possessions'},
        {'code': None, 'name': 'Hair pulling (trichotillomania)', 'category': 'Behavioral & Functional', 'description': 'Compulsive hair pulling'},
        {'code': None, 'name': 'Skin picking (excoriation)', 'category': 'Behavioral & Functional', 'description': 'Compulsive picking at skin'},
        {'code': None, 'name': 'Reckless behaviors', 'category': 'Behavioral & Functional', 'description': 'Engaging in dangerous activities'},
        {'code': None, 'name': 'Reduced self-care', 'category': 'Behavioral & Functional', 'description': 'Neglecting personal hygiene and health'},
        {'code': None, 'name': 'Isolating behaviors', 'category': 'Behavioral & Functional', 'description': 'Actively avoiding others'},
        {'code': None, 'name': 'Excessive spending', 'category': 'Behavioral & Functional', 'description': 'Impulsive or uncontrolled purchasing'},

        # ============================================================
        # 12. Developmental & Child-Specific (10 symptoms)
        # ============================================================
        {'code': 'F93.0', 'name': 'Separation anxiety (child)', 'category': 'Developmental & Child', 'description': 'Excessive anxiety when separated from caregivers'},
        {'code': None, 'name': 'Attachment difficulties', 'category': 'Developmental & Child', 'description': 'Problems forming bonds with caregivers'},
        {'code': None, 'name': 'Regression under stress', 'category': 'Developmental & Child', 'description': 'Return to earlier developmental stage'},
        {'code': None, 'name': 'Developmental delay concerns', 'category': 'Developmental & Child', 'description': 'Not meeting expected milestones'},
        {'code': None, 'name': 'School refusal', 'category': 'Developmental & Child', 'description': 'Resistance or inability to attend school'},
        {'code': None, 'name': 'Tantrums (excessive)', 'category': 'Developmental & Child', 'description': 'Frequent, severe emotional outbursts'},
        {'code': None, 'name': 'Oppositional behaviors', 'category': 'Developmental & Child', 'description': 'Defiant, argumentative behavior'},
        {'code': None, 'name': 'Selective mutism', 'category': 'Developmental & Child', 'description': 'Inability to speak in certain situations'},
        {'code': None, 'name': 'Enuresis (bedwetting)', 'category': 'Developmental & Child', 'description': 'Involuntary urination at inappropriate age'},
        {'code': None, 'name': 'Social skills deficits', 'category': 'Developmental & Child', 'description': 'Difficulty with age-appropriate social interactions'},

        # ============================================================
        # 13. Neurodevelopmental (12 symptoms)
        # ============================================================
        {'code': '6A05', 'name': 'ADHD—attention difficulties', 'category': 'Neurodevelopmental', 'description': 'Inattention, distractibility, difficulty focusing'},
        {'code': None, 'name': 'ADHD—hyperactivity/impulsivity', 'category': 'Neurodevelopmental', 'description': 'Excessive activity, acting without thinking'},
        {'code': '6A02', 'name': 'Autism spectrum indicators', 'category': 'Neurodevelopmental', 'description': 'Social communication difficulties, restricted interests'},
        {'code': None, 'name': 'Tics/stereotypies', 'category': 'Neurodevelopmental', 'description': 'Repetitive movements or vocalizations'},
        {'code': None, 'name': 'Sensory sensitivities', 'category': 'Neurodevelopmental', 'description': 'Over or under-reaction to sensory input'},
        {'code': None, 'name': 'Difficulty with transitions', 'category': 'Neurodevelopmental', 'description': 'Struggle with changes in routine'},
        {'code': None, 'name': 'Repetitive behaviors/routines', 'category': 'Neurodevelopmental', 'description': 'Need for sameness, rigid patterns'},
        {'code': None, 'name': 'Social communication deficits', 'category': 'Neurodevelopmental', 'description': 'Difficulty with back-and-forth interaction'},
        {'code': None, 'name': 'Restricted interests (intense)', 'category': 'Neurodevelopmental', 'description': 'Highly focused on specific topics'},
        {'code': None, 'name': 'Motor coordination problems', 'category': 'Neurodevelopmental', 'description': 'Clumsiness, difficulty with fine/gross motor skills'},
        {'code': None, 'name': 'Impulsive decision-making', 'category': 'Neurodevelopmental', 'description': 'Acting without considering consequences'},
        {'code': None, 'name': 'Difficulty reading social cues', 'category': 'Neurodevelopmental', 'description': 'Missing nonverbal communication signals'},
    ]
    
    # Transform data to match MasterSymptom model schema
    # Deduplicate by name (case-insensitive) and aggregate categories/tags
    aggregated = {}
    for item in symptoms_data:
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
                'description': description,
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
    
    # Prepare data for insertion
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
    
    # Create table reference for bulk insert
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
    
    # Bulk insert all symptoms
    if to_insert:
        op.bulk_insert(master_symptoms, to_insert)
        print(f"✅ Successfully seeded {len(to_insert)} mental health symptoms")


def downgrade() -> None:
    """Remove all symptom data."""
    op.execute("DELETE FROM master_symptoms")
    print("✅ Rolled back: Deleted all master symptoms")