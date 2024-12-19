
### **Route : POST `/` (Connexion Administrateur)**

#### **Description** :

Cette route permet à un administrateur de se connecter en fournissant son email et son mot de passe. En cas de succès, un token JWT est généré et renvoyé, accompagné des informations utilisateur.

---

### **Requête :**

| **Champ** | **Type** | **Obligatoire** | **Validation**                       | **Description**                |
| --------------- | -------------- | --------------------- | ------------------------------------------ | ------------------------------------ |
| `email`       | `string`     | Oui                   | Doit être une adresse email valide.       | L'email de l'administrateur.         |
| `password`    | `string`     | Oui                   | Aucun, mais sera comparé au hash en base. | Le mot de passe associé à l'email. |

#### **Exemple de requête :**

```json
{
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

---

### **Réponses :**

#### **1. Succès (HTTP 200)**

Si l'authentification réussit, les détails de l'utilisateur et un token JWT sont renvoyés.

| **Champ** | **Type** | **Description**                                  |
| --------------- | -------------- | ------------------------------------------------------ |
| `id`          | `string`     | Identifiant unique de l'utilisateur (UUID).            |
| `email`       | `string`     | Email de l'utilisateur.                                |
| `firstName`   | `string`     | Prénom de l'utilisateur.                              |
| `lastName`    | `string`     | Nom de famille de l'utilisateur.                       |
| `role`        | `string`     | Rôle de l'utilisateur (ici : "ADMIN").                |
| `token`       | `string`     | Token JWT à utiliser pour les requêtes sécurisées. |

**Exemple de réponse :**

```json
{
  "message": "Connexion réussie",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN",
    "token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
}
```

---

#### **2. Erreur : Champs manquants (HTTP 400)**

Si les champs requis ne sont pas fournis dans la requête.

**Exemple de réponse :**

```json
{
  "message": "Champs requis manquants",
  "data": {
    "missingFields": ["email", "password"]
  }
}
```

---

#### **3. Erreur : Email inconnu ou mot de passe incorrect (HTTP 400)**

Si l'email n'existe pas ou si le mot de passe est invalide.

**Exemple de réponse :**

```json
{
  "message": "Mot de passe incorrect",
  "data": null
}
```

---

#### **4. Erreur : Serveur (HTTP 500)**

Si une erreur inattendue survient côté serveur.

**Exemple de réponse :**

```json
{
  "message": "Erreur serveur",
  "data": {
    "error": "Détail de l'erreur technique."
  }
}
```

---

### **Résumé des Statuts HTTP**

| **Statut** | **Condition**                         | **Message**                                            |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------ |
| 200              | Authentification réussie                   | `"Connexion réussie"`                                     |
| 400              | Champs manquants ou identifiants incorrects | `"Champs requis manquants"`ou `"Mot de passe incorrect"` |
| 500              | Problème interne côté serveur            | `"Erreur serveur"`                                         |

---
