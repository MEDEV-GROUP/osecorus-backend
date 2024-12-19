### **Endpoint : `POST /admin/publish-message`**

#### **Description** :

Permet à un administrateur authentifié de publier un message dans le système.

---

### **Requête :**

| **Champ** | **Type** | **Obligatoire** | **Validation** | **Description**             |
| --------------- | -------------- | --------------------- | -------------------- | --------------------------------- |
| `title`       | `string`     | Oui                   | Doit être non vide. | Le titre du message à publier.   |
| `content`     | `string`     | Oui                   | Doit être non vide. | Le contenu détaillé du message. |

#### **Exemple de requête :**

```json
{
  "title": "Nouvelle mise à jour",
  "content": "Nous avons déployé une nouvelle fonctionnalité."
}
```

---

### **Réponses :**

#### **1. Succès (HTTP 201)**

Si le message est publié avec succès, les détails de la publication sont renvoyés.

| **Champ** | **Type** | **Description**                  |
| --------------- | -------------- | -------------------------------------- |
| `id`          | `string`     | Identifiant unique du message (UUID).  |
| `title`       | `string`     | Titre du message publié.              |
| `content`     | `string`     | Contenu du message publié.            |
| `created_at`  | `string`     | Date et heure de création du message. |

**Exemple de réponse :**

```json
{
  "message": "Message publié avec succès",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Nouvelle mise à jour",
    "content": "Nous avons déployé une nouvelle fonctionnalité.",
    "created_at": "2024-12-16T12:00:00Z"
  }
}
```

---

#### **2. Erreur : Non autorisé (HTTP 401)**

Si l'utilisateur n'est pas authentifié ou n'a pas le rôle `ADMIN`.

**Exemple de réponse :**

```json
{
  "message": "Accès interdit : seuls les administrateurs peuvent publier un message",
  "data": null
}
```

---

#### **3. Erreur : Champs requis manquants (HTTP 400)**

Si les champs obligatoires ne sont pas fournis dans la requête.

**Exemple de réponse :**

```json
{
  "message": "Champs requis manquants",
  "data": {
    "missingFields": ["title", "content"]
  }
}
```

---

#### **4. Erreur : Serveur (HTTP 500)**

Si une erreur inattendue survient côté serveur lors de la création du message.

**Exemple de réponse :**

```json
{
  "message": "Erreur lors de la publication du message",
  "data": {
    "error": "Détails de l'erreur technique."
  }
}
```

---

### **Résumé des Statuts HTTP**

| **Statut** | **Condition**                                 | **Message**                                                            |
| ---------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| 201              | Message publié avec succès                        | `"Message publié avec succès"`                                           |
| 401              | Utilisateur non authentifié ou rôle non autorisé | `"Accès interdit : seuls les administrateurs peuvent publier un message"` |
| 400              | Champs manquants dans la requête                   | `"Champs requis manquants"`                                                |
| 500              | Problème interne côté serveur                    | `"Erreur lors de la publication du message"`                               |

---
