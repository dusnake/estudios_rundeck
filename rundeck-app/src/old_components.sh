#!/bin/bash

# Crear directorio para componentes antiguos
mkdir -p ./Old_Components

# Lista de componentes que sabemos que están en uso
USED_COMPONENTS=(
  "MainMenu"
  "RundeckJobExecutor"
  "TabButton"
  "Section"
  "TabsMenu"
)

# Recorrer todos los directorios de componentes
for dir in ./components/*/; do
  component_name=$(basename "$dir")
  
  # Verificar si el componente está en la lista de usados
  is_used=false
  for used in "${USED_COMPONENTS[@]}"; do
    if [ "$used" == "$component_name" ]; then
      is_used=true
      break
    fi
  done
  
  # Si no está en uso, moverlo a Old_Components
  if [ "$is_used" == "false" ]; then
    echo "Moviendo componente no utilizado: $component_name"
    mkdir -p "./Old_Components/$component_name"
    cp -r "$dir"* "./Old_Components/$component_name/"
  fi
done

echo "Reorganización completada. Componentes no utilizados movidos a Old_Components/"
