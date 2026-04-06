import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { AppSettings } from '../types';
import { getAppCopy } from '../constants/appCopy';
import { getAppTheme } from '../constants/appTheme';

interface TutorialOverlayProps {
  visible: boolean;
  settings: AppSettings;
  onComplete: () => void;
  onSkip: () => void;
}

const CONTENT_STEPS = [
  { titleKey: 'tutorialStep1Title', bodyKey: 'tutorialStep1Body' },
  { titleKey: 'tutorialStep2Title', bodyKey: 'tutorialStep2Body' },
  { titleKey: 'tutorialStep3Title', bodyKey: 'tutorialStep3Body' },
  { titleKey: 'tutorialStep4Title', bodyKey: 'tutorialStep4Body' },
];

export default function TutorialOverlay({
  visible,
  settings,
  onComplete,
  onSkip,
}: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);

  const isRewardStep = currentStep === CONTENT_STEPS.length;
  const totalSteps = CONTENT_STEPS.length + 1; // +1 for reward

  const handleNext = () => {
    if (isRewardStep) {
      setCurrentStep(0);
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    setCurrentStep(0);
    onSkip();
  };

  const getStepContent = () => {
    if (isRewardStep) {
      return {
        title: copy.tutorialRewardTitle,
        body: copy.tutorialRewardBody,
      };
    }
    const step = CONTENT_STEPS[currentStep];
    return {
      title: copy[step.titleKey as keyof typeof copy] as string,
      body: copy[step.bodyKey as keyof typeof copy] as string,
    };
  };

  const content = getStepContent();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
        <SafeAreaView style={styles.safeContainer}>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.stepLabel, { color: theme.mutedText }]}>
                {currentStep + 1} / {totalSteps}
              </Text>
              <TouchableOpacity onPress={handleSkip}>
                <Text style={[styles.skipButton, { color: theme.mutedText }]}>
                  {copy.tutorialSkip}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.title, { color: theme.text }]}>{content.title}</Text>
              <Text style={[styles.body, { color: theme.mutedText }]}>{content.body}</Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              {!isRewardStep && (
                <View style={styles.dots}>
                  {CONTENT_STEPS.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            index === currentStep ? theme.accent : theme.border,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.accent }]}
                onPress={handleNext}
              >
                <Text style={[styles.buttonText, { color: theme.accentText }]}>
                  {isRewardStep ? copy.tutorialFinish : copy.tutorialNext}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  safeContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  skipButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    gap: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
