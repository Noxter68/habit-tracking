import { useState, useEffect } from 'react';
import { versionManager } from '../utils/versionManager';

export const useVersionCheck = () => {
  const [showModal, setShowModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      const shouldShow = await versionManager.shouldShowUpdate();
      setShowModal(shouldShow);
    } catch (error) {
      console.error('Version check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClose = async () => {
    const currentVersion = versionManager.getCurrentVersion();
    await versionManager.setLastSeenVersion(currentVersion);
    setShowModal(false);
  };

  return { showModal, isChecking, handleClose };
};
