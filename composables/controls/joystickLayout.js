import { ref, watch } from 'vue';

export const useJoystickLayout = () => {
  const leftStickPosition = ref({ x: 20, y: 70, size: 120 }); // Percentage values
  const rightStickPosition = ref({ x: 80, y: 70, size: 120 });
  const buttonsPosition = ref({ x: 80, y: 30, size: 150 });
  const triggersPosition = ref({ x: 20, y: 30, size: 100 });

  // Load saved positions from localStorage
  const loadLayout = () => {
    try {
      const savedLayout = localStorage.getItem('virtualJoystickLayout');
      if (savedLayout) {
        const layout = JSON.parse(savedLayout);
        leftStickPosition.value = layout.leftStick;
        rightStickPosition.value = layout.rightStick;
        buttonsPosition.value = layout.buttons;
        triggersPosition.value = layout.triggers;
      }
    } catch (error) {
      console.error('Error loading joystick layout:', error);
    }
  };

  // Save positions to localStorage
  const saveLayout = () => {
    try {
      const layout = {
        leftStick: leftStickPosition.value,
        rightStick: rightStickPosition.value,
        buttons: buttonsPosition.value,
        triggers: triggersPosition.value
      };
      localStorage.setItem('virtualJoystickLayout', JSON.stringify(layout));
    } catch (error) {
      console.error('Error saving joystick layout:', error);
    }
  };

  // Watch for changes and save
  watch([leftStickPosition, rightStickPosition, buttonsPosition, triggersPosition], 
    () => saveLayout(), 
    { deep: true }
  );

  return {
    leftStickPosition,
    rightStickPosition,
    buttonsPosition,
    triggersPosition,
    loadLayout,
    saveLayout
  };
}; 